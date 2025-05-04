export const uploadToS3 = async (file, path = '') => {
    const formData = new FormData();
    formData.append('file', file);
    if (path) formData.append('path', path);
  
    const response = await fetch('http://localhost:3000/upload-s3', {
      method: 'POST',
      body: formData,
    });
  
    if (!response.ok) {
      throw new Error(await response.text());
    }
  
    return response.json();
  };
  
  export const listS3Files = async () => {
    const response = await fetch('http://localhost:3000/list-s3');
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
  
    return response.json();
  };
  
  export const downloadS3File = async (key) => {
    const response = await fetch(`http://localhost:3000/download-s3?key=${encodeURIComponent(key)}`);
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
  
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = key.split('/').pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };
  
  export const deleteS3File = async (key) => {
    const response = await fetch(`http://localhost:3000/delete-s3?key=${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
  
    if (!response.ok) {
      throw new Error(await response.text());
    }
  };