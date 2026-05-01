const axios = require('axios');

const OCR_API_KEY = process.env.OCR_SPACE_API_KEY;

async function scanReceipt(imageBuffer) {
  const base64Image = imageBuffer.toString('base64');
  const params = new URLSearchParams();

  params.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
  params.append('language', 'eng');
  params.append('filetype', 'JPG');

  try {
    const response = await axios.post(
      'https://api.ocr.space/parse/image',
      params.toString(),
      {
        headers: {
          apikey: OCR_API_KEY,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('OCR API error:', error.message);
    throw new Error('OCR scan failed due to an error with the OCR API');
  }
}

module.exports = { scanReceipt };
