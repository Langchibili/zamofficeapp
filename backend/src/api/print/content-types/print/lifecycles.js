const path = require('path')
const socketClient = require('../../../../utils/socket-client');
const fs = require('fs/promises')
const fsSync = require('fs')
const util = require('util')
const execp = util.promisify(require('child_process').exec)
const os = require('os')
const pdfParse = require('pdf-parse')
const sharp = require('sharp')

async function fileExists(p) {
  try { await fs.access(p); return true } catch (e) { return false }
}

async function assignOrderId(print) {
  if (!print.company || !print.state || print.state !== 'queued') return;

  try {
    const company = await strapi.db.query('api::company.company').findOne({
      where: { id: print.company.id },
    });
    if (!company) return;

    const orderIdsEntry = await strapi.db.query('api::order-id.order-id').findOne({});
    if (!orderIdsEntry || !Array.isArray(orderIdsEntry.ids) || orderIdsEntry.ids.length === 0) return;

    let nextIndex = company.next_orderId_index || 0;
    const orderId = orderIdsEntry.ids[nextIndex];

    await strapi.entityService.update('api::print.print', print.id, {
      data: { order_id: orderId },
    });

    let updatedIndex = nextIndex + 1;
    if (updatedIndex >= orderIdsEntry.ids.length) updatedIndex = 0;

    await strapi.entityService.update('api::company.company', company.id, {
      data: { next_orderId_index: updatedIndex },
    });

    console.log(`[print lifecycle] assigned order ID ${orderId} to print ${print.id}`);
  } catch (err) {
    console.error('[print lifecycle] error assigning order ID:', err);
  }
}

async function getPdfPageCount(pdfPath) {
  try {
    const { stdout } = await execp(`pdfinfo "${pdfPath.replace(/"/g, '\\"')}"`)
    const match = stdout.match(/^Pages:\s+(\d+)/m)
    if (match) return parseInt(match[1], 10)
  } catch (err) {
    console.log('[pdf pages] pdfinfo failed, falling back to pdf-parse', err.message || err)
  }
  try {
    const data = await fs.readFile(pdfPath)
    const parsed = await pdfParse(data)
    const pages = parsed.text.split('\f').length
    return pages
  } catch (err) {
    console.log('[pdf pages] fallback pdf-parse failed', err)
    return 0
  }
}

function extractPdfFileIdFromData(pdfField) {
  if (pdfField == null) return null
  if (typeof pdfField === 'number') return Number(pdfField)
  if (typeof pdfField === 'string' && !isNaN(Number(pdfField))) return Number(pdfField)

  if (Array.isArray(pdfField) && pdfField.length > 0) {
    const first = pdfField[0]
    if (typeof first === 'number') return Number(first)
    if (typeof first === 'object' && (first.id || first[0])) return Number(first.id || first[0] || null)
  }

  if (typeof pdfField === 'object') {
    if (pdfField.id && !isNaN(Number(pdfField.id))) return Number(pdfField.id)
    if (pdfField.connect) {
      const c = pdfField.connect
      if (typeof c === 'number') return Number(c)
      if (typeof c === 'object' && (c.id || c[0])) return Number(c.id || c[0] || null)
      if (typeof c === 'string' && !isNaN(Number(c))) return Number(c)
    }
    const numeric = Object.values(pdfField).find(v => typeof v === 'number')
    if (numeric) return Number(numeric)
  }

  return null
}

/**
 * Update queue positions for all prints in a company's queue
 */
async function updateQueuePositions(companyId) {
  try {
    // Get company's queue
    const queue = await strapi.entityService.findOne('api::queue.queue', null, {
      filters: { company: companyId },
      populate: {
        prints: {
          sort: ['createdAt:asc']
        }
      }
    });

    if (!queue) {
      console.log('[updateQueuePositions] No queue found for company:', companyId);
      return;
    }

    const printsList = Array.isArray(queue.prints) ? queue.prints : [];
    const total = printsList.length;

    console.log(`[updateQueuePositions] Updating ${total} prints for company ${companyId}`);

    // Group prints by client for individual notifications
    const clientPrintsMap = new Map();
    
    // Update each print's position and group by client
    printsList.forEach((print, index) => {
      const position = index + 1;
      const clientId = print.client?.clientId || print.client?.id;
      
      // Update print position in database
      strapi.entityService.update('api::print.print', print.id, {
        data: { queue_position: position }
      }).catch(err => console.error('Error updating print position:', err));
      
      if (clientId) {
        if (!clientPrintsMap.has(clientId)) {
          clientPrintsMap.set(clientId, []);
        }
        clientPrintsMap.get(clientId).push({
          printId: print.id,
          position: position,
          orderId: print.order_id
        });
      }
    });

    // Send position updates to each client
    for (const [clientId, prints] of clientPrintsMap.entries()) {
      socketClient.emit('queue:position', {
        clientId,
        companyId,
        prints: prints,
        total: total,
      });
      console.log(`[updateQueuePositions] Sent positions to client ${clientId}:`, prints);
    }

    // Send general queue update
    socketClient.emit('queue:updated', {
      companyId,
      queue: {
        total: total,
        prints: printsList.map(p => ({
          id: p.id,
          clientId: p.client?.clientId || p.client?.id,
          orderId: p.order_id,
          fileName: p.file_details?.filename || 'document.pdf'
        }))
      }
    });

    console.log(`[updateQueuePositions] Queue updated with ${total} prints for company ${companyId}`);

  } catch (err) {
    console.error('[updateQueuePositions] error:', err);
  }
}

module.exports = {
  async afterCreate(event) {
    try {
      const { result } = event;
      console.log('[print lifecycle] afterCreate - print created:', result.id);

      if (result.client && result.company) {
        const clientId = typeof result.client === 'object' ? result.client.clientId || result.client.id : result.client;
        const companyId = typeof result.company === 'object' ? result.company.id : result.company;

        socketClient.emit('print:created', {
          printId: result.id,
          clientId,
          companyId,
          state: result.state,
        });

        console.log('[print lifecycle] emitted print:created event');
      }
    } catch (err) {
      console.error('[print lifecycle] afterCreate error:', err);
    }
  },

  async afterUpdate(event) {
    try {
      const { params, result } = event;
      
      // Handle PDF processing
      const touchedPdfField = Boolean(params?.data?.pdf_file);
      if (touchedPdfField) {
        await handlePdfProcessing(params, result);
      }

      // Handle state changes
      const stateChanged = params?.data?.state;
      if (stateChanged) {
        await handleStateChange(params, result, stateChanged);
      }

    } catch (err) {
      console.error('[print lifecycle] afterUpdate error:', err);
    }
  },
};

async function handlePdfProcessing(params, result) {
  const printId = result?.id || params?.where?.id;
  if (!printId) {
    console.log('[print lifecycle] cannot determine print id');
    return;
  }

  let pdfFileId = null;
  if (params.data.pdf_file) {
    pdfFileId = extractPdfFileIdFromData(params.data.pdf_file);
  }
  
  if (!pdfFileId && result.pdf_file) {
    if (typeof result.pdf_file === 'object') pdfFileId = result.pdf_file.id;
    else pdfFileId = result.pdf_file;
    pdfFileId = Number(pdfFileId);
  }

  if (!pdfFileId) {
    console.log('[print lifecycle] could not determine pdf_file id');
    return;
  }

  const fileEntry = await strapi.db.query('plugin::upload.file').findOne({ where: { id: pdfFileId } });
  if (!fileEntry || fileEntry.provider !== 'local' || !fileEntry.url) {
    console.log('[print lifecycle] file not accessible');
    return;
  }

  const urlPath = fileEntry.url.startsWith('/') ? fileEntry.url.slice(1) : fileEntry.url;
  const absolutePath = path.join(process.cwd(), 'public', urlPath);
  
  if (!(await fileExists(absolutePath))) {
    console.log('[print lifecycle] pdf file missing on disk');
    return;
  }

  const pageCount = await getPdfPageCount(absolutePath);
  const finalCostAmount = result.cost_per_page ? (result.cost_per_page * pageCount).toFixed(2) : null;
  
  await strapi.entityService.update('api::print.print', printId, {
    data: {
      file_pages_count: pageCount,
      final_cost_amount: finalCostAmount
    }
  });

  console.log(`[print lifecycle] saved page_count=${pageCount} for print ${printId}`);
}

async function handleStateChange(params, result, newState) {
  const fullPrint = await strapi.entityService.findOne('api::print.print', result.id, {
    populate: ['client', 'company', 'pdf_file'],
  });

  if (!fullPrint) {
    console.log('[print lifecycle] could not fetch full print');
    return;
  }

  const clientId = fullPrint.client?.clientId || fullPrint.client?.id;
  const companyId = fullPrint.company?.id;

  if (!clientId || !companyId) {
    console.log('[print lifecycle] missing clientId or companyId');
    return;
  }

  console.log(`[print lifecycle] State changed to: ${newState} for print ${result.id}`);

  switch (newState) {
    case 'queued':
      await handleQueuedState(fullPrint, clientId, companyId);
      break;
      
    case 'printing':
      socketClient.emit('print:printing', {
        printId: fullPrint.id,
        clientId,
        companyId,
        fileName: fullPrint.file_details?.filename || 'document.pdf',
      });
      break;
      
    case 'printed':
      await handlePrintedState(fullPrint, clientId, companyId);
      break;
      
    case 'canceled':
      await handleCanceledState(fullPrint, clientId, companyId, params);
      break;
  }
}

async function handleQueuedState(print, clientId, companyId) {
  // Assign order ID
  await assignOrderId(print);
  
  // Get updated print with order_id
  const updatedPrint = await strapi.db.query('api::print.print').findOne({
    where: { id: print.id },
    populate: ['client', 'company', 'pdf_file'],
  });

  // Get or create queue
  let queue = await strapi.db.query('api::queue.queue').findOne({
    where: { company: companyId }
  });

  if (!queue) {
    queue = await strapi.db.query('api::queue.queue').create({
      data: { 
        company: companyId,
        publishedAt: new Date().toISOString()
      }
    });
    console.log('[print lifecycle] Created new queue:', queue.id);
  }

  // Link print to queue
  await strapi.db.query('api::print.print').update({
    where: { id: updatedPrint.id },
    data: { queue: queue.id }
  });

  console.log('[print lifecycle] Linked print to queue:', updatedPrint.id, queue.id);

  // Emit queued event
  socketClient.emit('print:queued', {
    printId: updatedPrint.id,
    orderId: updatedPrint.order_id,
    clientId,
    companyId,
    fileName: updatedPrint.file_details?.filename || 'document.pdf',
    pages: updatedPrint.file_pages_count,
    cost: updatedPrint.final_cost_amount,
  });

  // Update queue positions
  await updateQueuePositions(companyId);
}

async function handlePrintedState(print, clientId, companyId) {
  // Remove from queue
  await strapi.entityService.update('api::print.print', print.id, {
    data: { queue: null, queue_position: null }
  });

  // Emit completed event
  socketClient.emit('print:completed', {
    printId: print.id,
    clientId,
    companyId,
    fileName: print.file_details?.filename || 'document.pdf',
  });

  // Update queue positions
  await updateQueuePositions(companyId);

  // Handle commissions and float (your existing logic here)
  // ... keep your existing commission and float logic
}

async function handleCanceledState(print, clientId, companyId, params) {
  // Remove from queue
  await strapi.entityService.update('api::print.print', print.id, {
    data: { queue: null, queue_position: null }
  });

  socketClient.emit('print:canceled', {
    printId: print.id,
    clientId,
    companyId,
    reason: params.data.cancelation_reason || 'No reason provided',
  });

  await updateQueuePositions(companyId);
}