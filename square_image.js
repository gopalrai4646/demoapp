const sharp = require('sharp');

async function makeSquare() {
  try {
    const image = sharp('src/assets/images/appicon.png');
    const metadata = await image.metadata();
    
    if (metadata.width === metadata.height) {
      console.log('Image is already square.');
      return;
    }
    
    const size = Math.max(metadata.width, metadata.height);
    
    await image
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile('src/assets/images/appicon_square.png');
      
    console.log('Successfully created square image.');
  } catch (err) {
    console.error('Error making image square:', err);
  }
}

makeSquare();
