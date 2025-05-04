import { useState } from 'react';
import AwsServiceCard from '../components/AwsSeriveCard';
import TabContainer from '../components/TabContainer';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  uploadToS3,
  listS3Files,
  downloadS3File,
  deleteS3File,
} from '../../services/s3Service';
import {
  writeEBSLog,
  readEBSLogs,
} from '../../services/ebsSerice';
import {
  writeEFSFile,
  readEFSFile,
  listEFSFiles,
} from '../../services/efsService';

const AwsStorageDemo = () => {
  // S3 State
  const [file, setFile] = useState(null);
  const [s3Path, setS3Path] = useState('');
  const [s3Files, setS3Files] = useState([]);
  const [s3Response, setS3Response] = useState(null);
  const [isS3Loading, setIsS3Loading] = useState(false);

  // EBS State
  const [logContent, setLogContent] = useState('');
  const [logLines, setLogLines] = useState(10);
  const [ebsLogs, setEbsLogs] = useState('');
  const [ebsResponse, setEbsResponse] = useState(null);
  const [isEbsLoading, setIsEbsLoading] = useState(false);

  // EFS State
  const [efsFilename, setEfsFilename] = useState('');
  const [efsContent, setEfsContent] = useState('');
  const [efsFiles, setEfsFiles] = useState([]);
  const [selectedEfsFile, setSelectedEfsFile] = useState('');
  const [efsReadContent, setEfsReadContent] = useState('');
  const [efsResponse, setEfsResponse] = useState(null);
  const [isEfsLoading, setIsEfsLoading] = useState(false);

  // S3 Handlers
  const handleS3Upload = async () => {
    if (!file) {
      setS3Response({ success: false, message: 'Please select a file first.' });
      return;
    }

    setIsS3Loading(true);
    try {
      const response = await uploadToS3(file, s3Path);
      setS3Response({ success: true, message: `File uploaded successfully to: ${response.location}` });
      await handleListS3Files(); // Refresh file list
    } catch (error) {
      setS3Response({ success: false, message: `Upload failed: ${error.message}` });
    } finally {
      setIsS3Loading(false);
    }
  };

  const handleListS3Files = async () => {
    setIsS3Loading(true);
    try {
      const files = await listS3Files();
      setS3Files(files);
    } catch (error) {
      console.error('Error listing S3 files:', error);
    } finally {
      setIsS3Loading(false);
    }
  };

  const handleDownloadS3File = async (key) => {
    try {
      await downloadS3File(key);
    } catch (error) {
      alert(`Download failed: ${error.message}`);
    }
  };

  const handleDeleteS3File = async (key) => {
    if (!window.confirm(`Are you sure you want to delete ${key}?`)) return;
    
    try {
      await deleteS3File(key);
      await handleListS3Files(); // Refresh file list
      alert('File deleted successfully');
    } catch (error) {
      alert(`Delete failed: ${error.message}`);
    }
  };

  // EBS Handlers
  const handleWriteEBS = async () => {
    if (!logContent.trim()) {
      setEbsResponse({ success: false, message: 'Please enter some log content.' });
      return;
    }

    setIsEbsLoading(true);
    try {
      const response = await writeEBSLog(logContent);
      setEbsResponse({ success: true, message: `Log written successfully at: ${response.timestamp}` });
    } catch (error) {
      setEbsResponse({ success: false, message: `Failed to write log: ${error.message}` });
    } finally {
      setIsEbsLoading(false);
    }
  };

  const handleReadEBS = async () => {
    setIsEbsLoading(true);
    try {
      const logs = await readEBSLogs(logLines);
      setEbsLogs(logs.join('\n'));
    } catch (error) {
      setEbsLogs(`Error reading logs: ${error.message}`);
    } finally {
      setIsEbsLoading(false);
    }
  };

  // EFS Handlers
  const handleWriteEFS = async () => {
    if (!efsFilename.trim()) {
      setEfsResponse({ success: false, message: 'Please enter a filename.' });
      return;
    }

    if (!efsContent.trim()) {
      setEfsResponse({ success: false, message: 'Please enter some content.' });
      return;
    }

    setIsEfsLoading(true);
    try {
      const response = await writeEFSFile(efsFilename, efsContent);
      setEfsResponse({ success: true, message: `File written successfully to: ${response.path}` });
      await handleListEFSFiles(); // Refresh file list
    } catch (error) {
      setEfsResponse({ success: false, message: `Failed to write file: ${error.message}` });
    } finally {
      setIsEfsLoading(false);
    }
  };

  const handleReadEFS = async () => {
    if (!selectedEfsFile) {
      alert('Please select a file first.');
      return;
    }

    setIsEfsLoading(true);
    try {
      const data = await readEFSFile(selectedEfsFile);
      setEfsReadContent(data.content);
    } catch (error) {
      setEfsReadContent(`Error reading file: ${error.message}`);
    } finally {
      setIsEfsLoading(false);
    }
  };

  const handleListEFSFiles = async () => {
    try {
      const files = await listEFSFiles();
      setEfsFiles(files);
    } catch (error) {
      console.error('Error listing EFS files:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-3xl font-bold text-indigo-700 mb-2">AWS Storage Services Demo</h1>
        <p className="text-gray-600">Interact with S3, EBS, and EFS storage services</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* S3 Service Card */}
        <AwsServiceCard
          title="Amazon S3 Service"
          icon={
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          description="Upload and manage files in S3 buckets with versioning and access control."
        >
          <TabContainer
            tabs={[
              { id: 'upload', label: 'Upload' },
              { id: 'list', label: 'List Files' },
            ]}
          >
            <div id="upload">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select file to upload:</label>
                <input
                  type="file"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">S3 Path (optional):</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., images/profile.jpg"
                  value={s3Path}
                  onChange={(e) => setS3Path(e.target.value)}
                />
              </div>
              <button
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={handleS3Upload}
                disabled={isS3Loading}
              >
                {isS3Loading && <LoadingSpinner className="mr-2" />}
                Upload to S3
              </button>
              {s3Response && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md border-l-4 border-indigo-500">
                  <StatusBadge success={s3Response.success} message={s3Response.message} />
                </div>
              )}
            </div>

            <div id="list">
              <button
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mb-4"
                onClick={handleListS3Files}
                disabled={isS3Loading}
              >
                {isS3Loading && <LoadingSpinner className="mr-2" />}
                List S3 Files
              </button>
              <div className="border rounded-md divide-y">
                {s3Files.length === 0 ? (
                  <p className="p-3 text-sm text-gray-500">No files found in S3 bucket.</p>
                ) : (
                  s3Files.map((file) => (
                    <div key={file.Key} className="p-3 flex justify-between items-center">
                      <span className="text-sm text-gray-800 truncate">{file.Key}</span>
                      <div className="flex space-x-2">
                        <button
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                          onClick={() => handleDownloadS3File(file.Key)}
                        >
                          Download
                        </button>
                        <button
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteS3File(file.Key)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabContainer>
        </AwsServiceCard>

        {/* EBS Service Card */}
        <AwsServiceCard
          title="Amazon EBS Service"
          icon={
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          }
          description="Read and write logs to persistent block storage attached to your EC2 instance."
        >
          <TabContainer
            tabs={[
              { id: 'write', label: 'Write Log' },
              { id: 'read', label: 'Read Logs' },
            ]}
          >
            <div id="write">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Log Content:</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows={4}
                  placeholder="Enter your log message..."
                  value={logContent}
                  onChange={(e) => setLogContent(e.target.value)}
                />
              </div>
              <button
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={handleWriteEBS}
                disabled={isEbsLoading}
              >
                {isEbsLoading && <LoadingSpinner className="mr-2" />}
                Write to EBS
              </button>
              {ebsResponse && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md border-l-4 border-indigo-500">
                  <StatusBadge success={ebsResponse.success} message={ebsResponse.message} />
                </div>
              )}
            </div>

            <div id="read">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of lines to retrieve:</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  max="100"
                  value={logLines}
                  onChange={(e) => setLogLines(parseInt(e.target.value))}
                />
              </div>
              <button
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mb-4"
                onClick={handleReadEBS}
                disabled={isEbsLoading}
              >
                {isEbsLoading && <LoadingSpinner className="mr-2" />}
                Read EBS Logs
              </button>
              <div className="p-3 bg-gray-50 rounded-md border-l-4 border-indigo-500">
                <pre className="text-sm whitespace-pre-wrap">{ebsLogs}</pre>
              </div>
            </div>
          </TabContainer>
        </AwsServiceCard>

        {/* EFS Service Card */}
        <AwsServiceCard
          title="Amazon EFS Service"
          icon={
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          }
          description="Shared file storage that can be accessed by multiple instances simultaneously."
        >
          <TabContainer
            tabs={[
              { id: 'write', label: 'Write File' },
              { id: 'read', label: 'Read Files' },
            ]}
          >
            <div id="write">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Filename:</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., shared-data.txt"
                  value={efsFilename}
                  onChange={(e) => setEfsFilename(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Content:</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows={4}
                  placeholder="Enter content to share..."
                  value={efsContent}
                  onChange={(e) => setEfsContent(e.target.value)}
                />
              </div>
              <button
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={handleWriteEFS}
                disabled={isEfsLoading}
              >
                {isEfsLoading && <LoadingSpinner className="mr-2" />}
                Write to EFS
              </button>
              {efsResponse && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md border-l-4 border-indigo-500">
                  <StatusBadge success={efsResponse.success} message={efsResponse.message} />
                </div>
              )}
            </div>

            <div id="read">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select file to read:</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={selectedEfsFile}
                  onChange={(e) => setSelectedEfsFile(e.target.value)}
                  onFocus={handleListEFSFiles}
                >
                  <option value="">-- Select a file --</option>
                  {efsFiles.map((file) => (
                    <option key={file} value={file}>
                      {file}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mb-4"
                onClick={handleReadEFS}
                disabled={isEfsLoading}
              >
                {isEfsLoading && <LoadingSpinner className="mr-2" />}
                Read from EFS
              </button>
              <div className="p-3 bg-gray-50 rounded-md border-l-4 border-indigo-500">
                <pre className="text-sm whitespace-pre-wrap">{efsReadContent}</pre>
              </div>
            </div>
          </TabContainer>
        </AwsServiceCard>
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>AWS Storage Services Demo &copy; {new Date().getFullYear()} | Built for educational purposes</p>
      </footer>
    </div>
  );
};

export default AwsStorageDemo;