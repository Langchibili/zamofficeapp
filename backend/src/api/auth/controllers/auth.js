const { createCoreController } = require('@strapi/strapi').factories;
const axios = require('axios');
const nodemailer = require('nodemailer');

const generateOTP = ()=> {
    const length = 6; // Length of the OTP
    const chars = '0123456789'; // Characters to be used in generating OTP
    let otp = '';
  
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        otp += chars[randomIndex];
    }
    otp = parseInt(otp) // to make sure that it is not being generated as a string
    if(otp.toString().length !== 6) return generateOTP()
    return otp;
}

const returnNineDigitNumber = (phoneNumber) =>{
    // Remove any non-digit characters
    let normalizedNumber = phoneNumber.replace(/\D/g, '')

    // Extract the last nine digits
    return normalizedNumber.slice(-9)
} 

const SendSmsNotification = (phoneNumber,notificationBody)=>{
    axios.post(process.env.SMSGATEWAYURL+"/send-sms", {
        apiKey: process.env.SMSGATEWAYAPIKEY,
        username: process.env.SMSGATEWAYAPIUSERNAME,
        recipients: [phoneNumber], // array of recipients
        message: notificationBody,
        from: process.env.SMSGATEWAYAPICALLERID
    }, {
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('SMS sent successfully:', response.data);
    })
    .catch(error => {
        console.error('Error sending SMS:', error);
    });
    console.log('sending sms notification',phoneNumber,notificationBody)
}

const SendEmailNotification = (email,notificationBody)=>{
    // Configure transport options
    const transporter = nodemailer.createTransport({
        service: process.env.EMAILSERVICENAME, // Or specify an SMTP host
        auth: {
        user: process.env.EMAILSERVICEUSERNAME,
        pass: process.env.EMAILSERVICEPASSWORD
        }
    })
    
    // Send email
    transporter.sendMail({
        from: process.env.EMAILSERVICEUSERNAME,
        to: email,
        subject: 'Message from Vector Finance Limited',
        text: notificationBody
    }, (error, info) => {
        if (error) {
        console.log('Error sending email:', error);
        } else {
        console.log('Email sent:', info.response);
        }
    });
    console.log('sending email notification',email,notificationBody)
}


const sendOtp = async (strapi, identifierType, identifier) => {
    let otpIdentifier = identifier
    if (identifierType === 'phoneNumber') {
        otpIdentifier = "+260"+returnNineDigitNumber(identifier)
    }
    const existingOtpObject = await strapi.db.query("api::auth.auth").findOne({ where: {identifier: otpIdentifier} })
    if(!existingOtpObject){ // means that the otp provided by the user actually exists and is correct
        const otp = generateOTP();
        // create a new otp
        await strapi.db.query("api::auth.auth").create({data:{ otp:otp, identifier:otpIdentifier, identifierType:identifierType }})
        const otpMessage = "Your VectorFin OTP is: "+otp
        if (identifierType === 'phoneNumber') {
            const phoneNumber = "+260"+returnNineDigitNumber(identifier)
            SendSmsNotification(phoneNumber,otpMessage)
        } else if (identifierType === 'email') {
            SendEmailNotification(identifier,otpMessage)
        }
    }
    else{ // otherwise then just send the existing otp
        const otpMessage = "Your VectorFin OTP is: "+existingOtpObject.otp
        if (identifierType === 'phoneNumber') {
            const phoneNumber = "+260"+returnNineDigitNumber(identifier)
            SendSmsNotification(phoneNumber,otpMessage)
        } else if (identifierType === 'email') {
            SendEmailNotification(identifier,otpMessage)
        }
    }
};

const updateClientNumbers = async (strapi, phone_number,identifierType) => {
    if(identifierType === 'email') {
        return
    }
    const phoneNumber = "+260" + returnNineDigitNumber(phone_number)
    let newPhoneNumbers = [];
    const numbersArray = await strapi.db.query("api::phone-numbers-list.phone-numbers-list").findOne();
    if (numbersArray && numbersArray.clientNumbers && !numbersArray.clientNumbers.includes(phoneNumber)) {
        newPhoneNumbers = [phoneNumber, ...numbersArray.clientNumbers];
        await strapi.db.query('api::phone-numbers-list.phone-numbers-list').update({ where: { id: numbersArray.id }, data: { clientNumbers: newPhoneNumbers } });
    }
  }
const updateClientEmails = async (strapi, email, identifierType) => {
    if(identifierType === 'phoneNumber') {
        return
    }
    let emails = [];
    const emailsArray = await strapi.db.query("api::email-addresses-list.email-addresses-list").findOne();
    if (emailsArray && emailsArray.clientEmailAddresses && !emailsArray.clientEmailAddresses.includes(email)) {
        emails = [email, ...emailsArray.clientEmailAddresses];
        await strapi.db.query('api::email-addresses-list.email-addresses-list').update({ where: { id: emailsArray.id }, data: { clientEmailAddresses: emails } });
    }
}

const verifyOtp = async (strapi, identifier, identifierType, otp)=>{
    let otpIdentifier = identifier
    if (identifierType === 'phoneNumber') {
        otpIdentifier = "+260"+returnNineDigitNumber(identifier)
    }
    const existingOtpObject = await strapi.db.query("api::auth.auth").findOne({ where: {identifier: otpIdentifier} })
    if(!existingOtpObject){ // means that the otp provided by the user actually exists and is correct
      return false
    }
    if(existingOtpObject === null || existingOtpObject === undefined){ // means that the otp provided by the user actually exists and is correc
      return false
    }

    if(parseInt(existingOtpObject.otp) === parseInt(otp)){
      /// delete otp
      updateClientNumbers(strapi,identifier,identifierType)
      updateClientEmails(strapi,identifier,identifierType)
      await strapi.db.query("api::auth.auth").delete({ where: {identifier: otpIdentifier} })
      // OTHERWISE IT MEANS WE HAVE VERIFIED YOUR OTP
      return true
    }
    return false
}


module.exports = createCoreController('api::auth.auth', ({ strapi }) => ({
    async find(ctx) {
      try {
       
        // Sanitize query parameters
        const sanitizedQueryParams = await this.sanitizeQuery(ctx);
  
        // Check if phone_number is provided in the sanitized query parameters
        const { auth_stage,otp,identifier,identifierType, ...query } = sanitizedQueryParams;
        // note that the phone_number is required in the query parameters list 
       
        if(auth_stage === "sendotp"){
          // send otp as sms /api/auths?phone_number=xxx&auth_stage=sendotp
          if (!identifier || !identifierType) {
             ctx.badRequest('Identifier and identifierType are required');
          }
      
          await sendOtp(strapi, identifierType, identifier);
          ctx.send({ message: 'OTP sent successfully' });
        }
        else{
             if(auth_stage === "verification"){
                // verify the otp, in this situation we check if an otp exists for the provided number and see if it's corrent /api/auths?phone_number=xxx&otp=xxx&auth_stage=verification&intent=signup&userType=xxx
                  if (!identifier || !otp) {
                     ctx.badRequest('Identifier and OTP are required');
                  }
              
                  const isValid = await verifyOtp(strapi, identifier, identifierType, otp);
                  if (isValid) {
                    ctx.send({ message: 'OTP verified successfully',verificationStatus: true });
                  }
                  else{
                    ctx.send({ message: 'OTP verification failed',verificationStatus: false });
                  }
             }
             else{
                 ctx.badRequest('auth_stage must be set');
             } 
        }
      } catch (error) {
        // Handle errors
        console.log(error);
        ctx.badRequest('Failed to authenticate user');
      }
    },
  }));