export const writeEFSFile = async (filename, content) => {
    const response = await fetch('http://localhost:3000/write-efs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, content }),
    });
  
    if (!response.ok) {
      throw new Error(await response.text());
    }
  
    return response.json();
  };
  
  export const readEFSFile = async (filename) => {
    const response = await fetch(`http://localhost:3000/read-efs?filename=${encodeURIComponent(filename)}`);
  
    if (!response.ok) {
      throw new Error(await response.text());
    }
  
    return response.json();
  };
  
  export const listEFSFiles = async () => {
    const response = await fetch('http://localhost:3000/list-efs');
  
    if (!response.ok) {
      throw new Error(await response.text());
    }
  
    return response.json();
  };