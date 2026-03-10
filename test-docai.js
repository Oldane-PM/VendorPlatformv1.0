const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;

async function testAuth() {
  console.log('Testing Google Cloud Document AI Authentication...');
  console.log('Project ID:', process.env.GOOGLE_CLOUD_PROJECT_ID);
  console.log('Location:', process.env.GOOGLE_CLOUD_LOCATION);
  console.log('Processor ID:', process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID);

  try {
    const client = new DocumentProcessorServiceClient();
    
    // Test getting the processor info
    const name = `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/${process.env.GOOGLE_CLOUD_LOCATION}/processors/${process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID}`;
    
    console.log(`Fetching processor details for: ${name}`);
    
    const [processor] = await client.getProcessor({ name });
    
    console.log('✅ Successfully authenticated and accessed Document AI!');
    console.log('Processor Name:', processor.displayName);
    console.log('Processor Type:', processor.type);
    console.log('Processor State:', processor.state);
    
  } catch (error) {
    console.error('❌ Failed Document AI Test Integration:');
    console.error(error.message);
  }
}

testAuth();
