/**
 * Test script for Azure OpenAI credentials
 * Tests connection and verifies GPT-4o-mini model availability
 */

const apiKey = 'EtV8YXPGmUc34UVxwT9hd4pX00hzKQSvNbjVFFoQDK0BRKI5qIuqJQQJ99BIACHYHv6XJ3w3AAAAACOGOBgU';
const endpoint = 'https://10062537-5848-resource.cognitiveservices.azure.com/';
const deploymentName = 'model-router';
const apiVersion = '2024-08-01-preview';

async function testAzureOpenAI() {
  console.log('🧪 Testing Azure OpenAI Connection...\n');
  console.log('Configuration:');
  console.log(`  Endpoint: ${endpoint}`);
  console.log(`  Deployment: ${deploymentName}`);
  console.log(`  API Version: ${apiVersion}`);
  console.log(`  API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 10)}\n`);

  const url = `${endpoint}openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

  console.log(`📡 Request URL: ${url}\n`);

  try {
    console.log('⏳ Sending test request...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Respond briefly and confirm you are using GPT-4o-mini model.'
          },
          {
            role: 'user',
            content: 'Hello! Please confirm which model you are and respond with a short greeting.'
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:');
      console.error(errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log('✅ Success! Connection verified.\n');
    console.log('📝 Response Data:');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n💬 AI Response:');
    console.log(data.choices[0].message.content);

    console.log('\n📊 Model Information:');
    console.log(`  Model: ${data.model || 'Not specified'}`);
    console.log(`  Tokens Used: ${data.usage?.total_tokens || 'Not specified'}`);
    console.log(`  Prompt Tokens: ${data.usage?.prompt_tokens || 'Not specified'}`);
    console.log(`  Completion Tokens: ${data.usage?.completion_tokens || 'Not specified'}`);

    console.log('\n✨ Azure OpenAI credentials are working correctly!');
    return true;

  } catch (error) {
    console.error('\n❌ Test Failed!');
    console.error('Error:', error.message);

    if (error.cause) {
      console.error('Cause:', error.cause);
    }

    return false;
  }
}

// Run the test
testAzureOpenAI()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
