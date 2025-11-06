// ./src/extensions/upload/strapi-server.js
const path = require('path')
const fs = require('fs/promises')
const fsSync = require('fs')
const os = require('os')
const crypto = require('crypto')

const libre = require('libreoffice-convert')
const PDFDocument = require('pdfkit')
const sharp = require('sharp')
const puppeteer = require('puppeteer')
const ffmpeg = require('fluent-ffmpeg')

function generateHash(name) {
  return crypto.createHash('md5').update(name + Date.now().toString()).digest('hex')
}
async function fileExists(p) {
  try { await fs.access(p); return true } catch(e){ return false }
}

/* --- Conversion helpers --- */
async function convertImageToPdf(inputPath, outputPath) {
  const imageBuffer = await fs.readFile(inputPath)
  const metadata = await sharp(imageBuffer).metadata().catch(()=>({ width: 612, height: 792 }))
  const doc = new PDFDocument({ autoFirstPage: false })
  const writable = fsSync.createWriteStream(outputPath)
  doc.pipe(writable)
  doc.addPage({ size: [metadata.width || 612, metadata.height || 792] })
  doc.image(imageBuffer, 0, 0, { width: metadata.width || 612 })
  doc.end()
  await new Promise((res, rej) => writable.on('finish', res).on('error', rej))
  return outputPath
}

async function convertOfficeToPdf(inputPath, outputPath) {
  const buffer = await fs.readFile(inputPath)
  return new Promise((resolve, reject) => {
    libre.convert(buffer, '.pdf', undefined, (err, done) => {
      if (err) return reject(err)
      fs.writeFile(outputPath, done).then(()=>resolve(outputPath)).catch(reject)
    })
  })
}

async function convertHtmlToPdf(inputPath, outputPath) {
  const html = (await fs.readFile(inputPath)).toString()
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.pdf({ path: outputPath, format: 'A4' })
  } finally { await browser.close() }
  return outputPath
}

async function convertTextToPdf(inputPath, outputPath) {
  const text = (await fs.readFile(inputPath)).toString()
  const doc = new PDFDocument()
  const stream = fsSync.createWriteStream(outputPath)
  doc.pipe(stream)
  doc.fontSize(12).text(text, { align: 'left' })
  doc.end()
  await new Promise((res, rej) => stream.on('finish', res).on('error', rej))
  return outputPath
}

async function convertVideoAudioToPdf(inputPath, outputPath) {
  // create thumbnail (50% frame) then embed into PDF
  const tmpdir = os.tmpdir()
  const thumbName = `thumb-${Date.now()}.png`
  const thumbPath = path.join(tmpdir, thumbName)

  await new Promise((resolve) => {
    ffmpeg(inputPath)
      .screenshots({ timestamps: ['50%'], filename: thumbName, folder: tmpdir, size: '640x?' })
      .on('end', resolve)
      .on('error', (err) => { console.log('ffmpeg error (ignored):', err); resolve() })
  })

  const doc = new PDFDocument()
  const stream = fsSync.createWriteStream(outputPath)
  doc.pipe(stream)
  if (await fileExists(thumbPath)) {
    const buffer = await fs.readFile(thumbPath)
    const md = await sharp(buffer).metadata().catch(()=>({ width: 640, height: 360 }))
    doc.addPage({ size: [md.width, md.height + 120] })
    doc.image(buffer, 0, 0, { width: md.width })
    doc.moveDown()
    doc.fontSize(10).text('This was a video/audio file — play the original file to hear/watch it.')
    await fs.unlink(thumbPath).catch(()=>{})
  } else {
    doc.fontSize(12).text('This was a video/audio file — play the original file to hear/watch it.')
  }
  doc.end()
  await new Promise((res, rej) => stream.on('finish', res).on('error', rej))
  return outputPath
}

/* --- Main plugin lifecycles --- */
module.exports = (plugin) => {
  plugin.contentTypes['file'].lifecycles = {
    async afterCreate(event) {
      try {
        const { result } = event
        console.log('[upload lifecycle] file uploaded id=', result.id, 'name=', result.name)

        // find related entries (morph)
        const fileWithRel = await strapi.db.query('plugin::upload.file').findOne({
          where: { id: result.id },
          populate: { related: true },
        })

        const related = fileWithRel?.related || []
        // find a related print entry if any
        const printRel = related.find(r => {
          // __type is usually like 'api::print.print' — check common shapes
          if (r?.__type && r.__type === 'api::print.print') return true
          if (r?.__type && r.__type.includes('print')) return true
          if (r?.model && r.model === 'api::print.print') return true
          return false
        })

        if (!printRel) {
          console.log('[upload lifecycle] no related print found for file', result.id, '- skipping attachment to pdf_file')
          return
        }

        const printId = printRel.id
        console.log('[upload lifecycle] file is related to print id=', printId)

        // If already PDF -> attach directly
        if ((result.ext && result.ext.toLowerCase() === '.pdf') || (result.mime && result.mime === 'application/pdf')) {
          console.log('[upload lifecycle] file already PDF — attaching to print.pdf_file')
          await strapi.entityService.update('api::print.print', printId, {
            data: { pdf_file: result.id },
          })
          console.log(`[upload lifecycle] attached file ${result.id} to print ${printId}.pdf_file`)
          return
        }

        // Not a PDF: convert
        const urlPath = result.url.startsWith('/') ? result.url.slice(1) : result.url
        const inputPath = path.join(process.cwd(), 'public', urlPath)

        if (!await fileExists(inputPath)) {
          console.log('[upload lifecycle] input file missing on disk:', inputPath)
          return
        }

        const folder = path.dirname(inputPath)
        const baseName = path.basename(result.name, path.extname(result.name)).replace(/\s+/g, '_')
        const outName = `${baseName}_${Date.now()}.pdf`
        const outPath = path.join(folder, outName)
        console.log('[upload lifecycle] converting', inputPath, '->', outPath)

        const mime = result.mime || ''
        const ext = (result.ext || '').toLowerCase()
        let convertedPath = null

        if (mime.startsWith('image/') || ['.jpg','.jpeg','.png','.webp','.tiff','.gif'].includes(ext)) {
          convertedPath = await convertImageToPdf(inputPath, outPath)
        } else if (['.doc','.docx','.xls','.xlsx','.ppt','.pptx','.odt','.ods','.odp'].includes(ext) || /msword|officedocument|vnd.openxmlformats-officedocument/.test(mime)) {
          convertedPath = await convertOfficeToPdf(inputPath, outPath)
        } else if (ext === '.html' || mime === 'text/html') {
          convertedPath = await convertHtmlToPdf(inputPath, outPath)
        } else if (mime.startsWith('text/') || ['.txt','.csv'].includes(ext)) {
          convertedPath = await convertTextToPdf(inputPath, outPath)
        } else if (mime.startsWith('video/') || mime.startsWith('audio/') || ['.mp4','.mov','.mp3','.wav','.m4a','.avi','.mkv'].includes(ext)) {
          convertedPath = await convertVideoAudioToPdf(inputPath, outPath)
        } else {
          // fallback small wrapper PDF
          const doc = new PDFDocument()
          const stream = fsSync.createWriteStream(outPath)
          doc.pipe(stream)
          doc.fontSize(14).text(`Original filename: ${result.name}`)
          doc.moveDown()
          doc.fontSize(10).text('This file type could not be converted automatically. Open the original file to view it.')
          doc.end()
          await new Promise((res, rej) => stream.on('finish', res).on('error', rej))
          convertedPath = outPath
        }

        if (!convertedPath || !await fileExists(convertedPath)) {
          console.log('[upload lifecycle] conversion failed or produced no file for', result.id)
          return
        }

        // create a new upload record for the generated PDF (local provider)
        const stats = await fs.stat(convertedPath)
        const newUrl = '/uploads/' + path.basename(convertedPath)

        const newFile = await strapi.db.query('plugin::upload.file').create({
          data: {
            name: path.basename(convertedPath),
            alternativeText: null,
            caption: null,
            hash: generateHash(path.basename(convertedPath)),
            ext: '.pdf',
            mime: 'application/pdf',
            size: Number((stats.size / 1024).toFixed(2)), // keep size similar to your example (KB)
            url: newUrl,
            provider: 'local',
            provider_metadata: null,
            folderPath: path.dirname(newUrl),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })

        console.log(`[upload lifecycle] created converted pdf upload record id=${newFile.id}, url=${newFile.url}`)

        // Attach to print.pdf_file
        await strapi.entityService.update('api::print.print', printId, {
          data: { pdf_file: newFile.id },
        })

        console.log(`[upload lifecycle] attached converted pdf (id=${newFile.id}) to print ${printId}.pdf_file`)

        // optional: remove original upload file from disk & DB — left commented for safety
        // await fs.unlink(inputPath).catch(()=>{})
        // await strapi.db.query('plugin::upload.file').delete({ where: { id: result.id } })

      } catch (err) {
        console.log('[upload lifecycle] error:', err)
      }
    },
  }

  return plugin
}
