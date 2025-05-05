import express from 'express';
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import 'dotenv/config';

const app = express();

app.use(cors());
app.use(express.json());
const upload = multer({ dest: 'uploads/' }); // Temp storage
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET;

const EBS_MOUNT_PATH = '/mnt/ebs';  // Where EBS volume is mounted
const EFS_MOUNT_PATH = '/mnt/efs';   // Where EFS is mounted
const EBS_LOG_FILE = path.join(EBS_MOUNT_PATH, 'app.log');

const initializeStorage = () => {
  try {
    // Create directories if they don't exist
    if (!fs.existsSync(EBS_MOUNT_PATH)) {
      fs.mkdirSync(EBS_MOUNT_PATH, { recursive: true });
      console.log(`Created EBS mount directory at ${EBS_MOUNT_PATH}`);
    }
    
    if (!fs.existsSync(EFS_MOUNT_PATH)) {
      fs.mkdirSync(EFS_MOUNT_PATH, { recursive: true });
      console.log(`Created EFS mount directory at ${EFS_MOUNT_PATH}`);
    }
    
    // Verify EBS is writable
    fs.accessSync(EBS_MOUNT_PATH, fs.constants.W_OK);
    // Verify EFS is writable
    fs.accessSync(EFS_MOUNT_PATH, fs.constants.W_OK);
    
    console.log('Storage systems initialized successfully');
  } catch (err) {
    console.error('Storage initialization failed:', err);
    process.exit(1); // Exit if storage isn't available
  }
};

app.post('/upload-s3', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const filePath = req.body.path 
    ? path.join(req.body.path, req.file.originalname) 
    : req.file.originalname;

  try {
    const fileStream = fs.createReadStream(req.file.path);
    
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
      Body: fileStream,
    }));
    
    fs.unlinkSync(req.file.path); // Clean up temp file
    res.json({ 
      location: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}` 
    });
  } catch (err) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

app.post('/write-ebs-log', (req, res) => {
  try {
    const content = req.body.content || `[${new Date().toISOString()}] New log entry\n`;
    
    // Append to EBS log file
    fs.appendFileSync(EBS_LOG_FILE, content);
    
    res.json({ 
      success: true,
      timestamp: new Date().toISOString(),
      path: EBS_LOG_FILE
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'EBS write failed',
      details: err.message 
    });
  }
});

app.get('/read-ebs-logs', (req, res) => {
  try {
    // 1. Read file content
    const content = fs.existsSync(EBS_LOG_FILE)
      ? fs.readFileSync(EBS_LOG_FILE, 'utf-8')
      : '';

    // 2. Process into array of log entries
    const logArray = typeof content === 'string'
      ? content.split(/\r?\n/).filter(line => line.trim().length > 0)
      : [];

    // 3. Format response
    const response = {
      status: 'success',
      data: {
        logs: logArray,  // Guaranteed to be an array
        count: logArray.length,
        fileInfo: {
          path: EBS_LOG_FILE,
          exists: fs.existsSync(EBS_LOG_FILE),
          size: content.length
        }
      }
    };

    return res.json(response);

  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to read logs',
      error: {
        name: err.name,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      }
    });
  }
});


app.post('/write-efs', (req, res) => {
  try {
    const { filename, content } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    const filePath = path.join(EFS_MOUNT_PATH, filename);
    fs.writeFileSync(filePath, content || '');
    
    res.json({ 
      success: true,
      path: filePath,
      size: fs.statSync(filePath).size
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'EFS write failed',
      details: err.message 
    });
  }
});

app.get('/read-efs', (req, res) => {
  try {
    const { filename } = req.query;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    const filePath = path.join(EFS_MOUNT_PATH, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json({
      content: fs.readFileSync(filePath, 'utf-8'),
      stats: fs.statSync(filePath)
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'EFS read failed',
      details: err.message 
    });
  }
});

app.get('/list-efs', (req, res) => {
  try {
    if (!fs.existsSync(EFS_MOUNT_PATH)) {
      return res.json({ files: [], message: 'EFS directory is empty' });
    }
    
    const files = fs.readdirSync(EFS_MOUNT_PATH);
    
    res.json({
      count: files.length,
      files: files.map(file => ({
        name: file,
        path: path.join(EFS_MOUNT_PATH, file),
        stats: fs.statSync(path.join(EFS_MOUNT_PATH, file))
      }))
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'EFS list failed',
      details: err.message 
    });
  }
});

app.listen(3000, () => {
  initializeStorage(); // Validate storage systems
  console.log('Server running on http://localhost:3000');
});