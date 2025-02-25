import { Router } from 'express';
import jwt from 'jsonwebtoken';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Applicant from '../models/applicant.js';
import { encrypt, decrypt } from '../utils/encryption.js';

const router = Router();
const SECRET_KEY = process.env.JWT_SECRET;

// Initialize Gemini API with safety check
if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables');
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No token provided or invalid format. Use 'Bearer your.jwt.token'" });
    }

    const token = authHeader.split(' ')[1]; // Remove 'Bearer ' prefix

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

const extractTextFromPDF = async (url) => {
    try {
        console.log('Fetching PDF from URL:', url);
        const response = await axios.get(url, { 
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        console.log('PDF fetched successfully');
        
        const buffer = Buffer.from(response.data);
        console.log('Processing PDF content');
        const data = await pdf(buffer);
        console.log('PDF processed successfully');
        return data.text;
    } catch (error) {
        console.error('PDF extraction error details:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
};

const processResumeWithGemini = async (text) => {
    try {
        console.log('Initializing Gemini API');
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        console.log('Preparing prompt for Gemini');
        const prompt = `You are a resume parser. Extract the following information from the resume text and format it as a valid JSON object. If any field is not found, use null or empty array as appropriate.

        Required format:
        {
            "name": "full name of the candidate",
            "email": "email address",
            "education": {
                "degree": "highest degree obtained",
                "branch": "specialization or branch",
                "institution": "university or college name",
                "year": graduation year as number
            },
            "experience": {
                "job_title": "most recent job title",
                "company": "most recent company name",
                "start_date": "start date in YYYY-MM format",
                "end_date": "end date in YYYY-MM format or 'present'"
            },
            "skills": ["skill1", "skill2", "etc"],
            "summary": "brief professional summary"
        }

        Resume text to parse:
        ${text}

        Remember to:
        1. Only return a valid JSON object
        2. Use null for missing fields
        3. Use empty array [] for missing skills
        4. Ensure all dates are in YYYY-MM format
        5. Do not include any explanations or markdown, just the JSON`;

        console.log('Sending request to Gemini API');
        const result = await model.generateContent(prompt);
        console.log('Received response from Gemini');
        
        if (!result || !result.response) {
            throw new Error('Empty response from Gemini API');
        }

        const responseText = result.response.text();
        console.log('Raw Gemini response:', responseText);
        
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON object found in response');
        }

        const cleanJson = jsonMatch[0].trim();
        const parsedData = JSON.parse(cleanJson);

        // Validate required fields
        if (!parsedData.name || !parsedData.email) {
            throw new Error('Required fields (name, email) missing in parsed data');
        }

        console.log('Successfully parsed resume data:', parsedData);
        return parsedData;
    } catch (error) {
        console.error('Gemini API error details:', error);
        throw new Error(`Failed to process resume with Gemini API: ${error.message}`);
    }
};

router.post('/process', verifyJWT, async (req, res) => {
    const { url } = req.body;

    try {
        console.log('Starting resume processing for URL:', url);
        const textData = await extractTextFromPDF(url);
        if (!textData) {
            console.error('No text found in PDF');
            return res.status(500).json({ error: "No text found in PDF" });
        }
        console.log('Text extracted successfully, length:', textData.length);

        console.log('Processing with Gemini API');
        const processedData = await processResumeWithGemini(textData);
        console.log('Gemini processing complete');

        // Encrypt sensitive data
        const encryptedData = {
            ...processedData,
            name: encrypt(processedData.name),
            email: encrypt(processedData.email)
        };

        const applicant = new Applicant(encryptedData);
        await applicant.save();
        console.log('Data saved to database');

        // Decrypt data for response
        const responseData = {
            ...processedData,
            name: decrypt(encryptedData.name),
            email: decrypt(encryptedData.email)
        };

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Resume processing error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/search', verifyJWT, async (req, res) => {
    const { name } = req.body;

    try {
        // Get all applicants and decrypt names for comparison
        const allApplicants = await Applicant.find({});
        const matchingApplicants = allApplicants.filter(applicant => {
            const decryptedName = decrypt(applicant.name);
            return decryptedName.toLowerCase().includes(name.toLowerCase());
        });

        if (matchingApplicants.length === 0) {
            return res.status(404).json({ error: "No matching resumes found" });
        }

        // Decrypt sensitive data for response
        const decryptedResults = matchingApplicants.map(applicant => ({
            ...applicant.toObject(),
            name: decrypt(applicant.name),
            email: decrypt(applicant.email)
        }));

        res.status(200).json(decryptedResults);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Temporary route to list all applicants
router.get('/list', verifyJWT, async (req, res) => {
    try {
        const applicants = await Applicant.find({});
        const decryptedApplicants = applicants.map(applicant => ({
            ...applicant.toObject(),
            name: decrypt(applicant.name),
            email: decrypt(applicant.email)
        }));
        res.json(decryptedApplicants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
