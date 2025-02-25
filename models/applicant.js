import { Schema, model } from 'mongoose';

const applicantSchema = new Schema({
    name: String,
    email: String,
    education: {
        degree: String,
        branch: String,
        institution: String,
        year: Number
    },
    experience: {
        job_title: String,
        company: String,
        start_date: String,
        end_date: String
    },
    skills: [String],
    summary: String
});

export default model('Applicant', applicantSchema);
