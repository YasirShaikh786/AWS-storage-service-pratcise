export const writeEBSLog = async (content) => {
    const response = await fetch('http://localhost:3000/write-ebs-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  
    if (!response.ok) {
      throw new Error(await response.text());
    }
  
    return response.json();
  };
  
  export const readEBSLogs = async (lines = 10) => {
    const response = await fetch(`http://localhost:3000/read-ebs-logs?lines=${lines}`);
  
    if (!response.ok) {
      throw new Error(await response.text());
    }
  
    return response.json();
  };