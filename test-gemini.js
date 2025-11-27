import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI('AIzaSyB8iipPzPyXQqbOcVqql6LTCg_SqSeFcmE');
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 100,
      },
    });
    
    console.log('🔍 Testing Gemini API connection...');
    const result = await model.generateContent('Hello, are you working?');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API is working! Response:', text);
    return true;
  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
    return false;
  }
}

testGemini();
