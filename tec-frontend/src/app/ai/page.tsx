// Updated JSON parsing for the new streaming method
function parseJSONStreaming(response) {
    let data = '';
    response.on('data', chunk => {
        data += chunk;
    });
    response.on('end', () => {
        try {
            const jsonData = JSON.parse(data);
            // Handle the parsed jsonData
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });
} 
