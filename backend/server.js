import express from 'express';
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import 'dotenv/config';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
const upload = multer({ dest: 'uploads/' }); // Temp storage

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET;

// Ensure directories exist
const EBS_LOG_PATH = '/mnt/ebs/log.txt';
const EFS_DIR = '/mnt/efs';

// S3 Routes
app.post('/upload-s3', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const filePath = req.body.path 
    ? path.join(req.body.path, req.file.originalname) 
    : req.file.originalname;

  try {
    const fileStream = fs.createReadStream(req.file.path);
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: filePath,
      Body: fileStream,
    };

    await s3Client.send(new PutObjectCommand(params));
    fs.unlinkSync(req.file.path); // Clean up temp file
    
    res.json({ 
      location: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}` 
    });
  } catch (err) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

app.get('/list-s3', async (req, res) => {
  try {
    const data = await s3Client.send(
      new ListObjectsV2Command({ Bucket: BUCKET_NAME })
    );
    res.json(data.Contents || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/download-s3', async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: 'Key is required' });
    
    const data = await s3Client.send(
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key })
    );
    
    // Convert stream to buffer for Express response
    const chunks = [];
    for await (const chunk of data.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    res.attachment(path.basename(key));
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/delete-s3', async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: 'Key is required' });
    
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key })
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EBS Routes (unchanged)
app.post('/write-ebs-log', (req, res) => {
  try {
    const content = req.body.content || `Log at ${new Date().toISOString()}\n`;
    fs.appendFileSync(EBS_LOG_PATH, content);
    res.json({ timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/read-ebs-logs', (req, res) => {
  try {
    const lines = parseInt(req.query.lines) || 10;
    if (!fs.existsSync(EBS_LOG_PATH)) return res.json([]);
    
    const content = fs.readFileSync(EBS_LOG_PATH, 'utf-8');
    const logLines = content.split('\n').filter(line => line.trim());
    res.json(logLines.slice(-lines));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EFS Routes (unchanged)
app.post('/write-efs', (req, res) => {
  try {
    const { filename, content } = req.body;
    if (!filename) return res.status(400).json({ error: 'Filename is required' });
    
    const filePath = path.join(EFS_DIR, filename);
    fs.writeFileSync(filePath, content || '');
    res.json({ path: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/read-efs', (req, res) => {
  try {
    const { filename } = req.query;
    if (!filename) return res.status(400).json({ error: 'Filename is required' });
    
    const filePath = path.join(EFS_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
    
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/list-efs', (req, res) => {
  try {
    if (!fs.existsSync(EFS_DIR)) return res.json([]);
    
    const files = fs.readdirSync(EFS_DIR);
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  
  // Create directories if they don't exist
  if (!fs.existsSync('/mnt/ebs')) fs.mkdirSync('/mnt/ebs', { recursive: true });
  if (!fs.existsSync('/mnt/efs')) fs.mkdirSync('/mnt/efs', { recursive: true });
});