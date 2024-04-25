import path from "node:path";
import stream from "node:stream";
import express from "express";
import { google } from "googleapis";
import multer from "multer";

const app = express();

const PORT = process.env.PORT || 8000;

// Multer SETUP

// Middlewares
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.resolve("./public/images/"));
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		cb(
			null,
			`${file.fieldname}-${uniqueSuffix}.${file.mimetype.split("/")[1]}`,
		);
	},
});

const upload = multer();

// Google drive setup
const scopes = ["https://www.googleapis.com/auth/drive"];
const auth = new google.auth.GoogleAuth({
	scopes,
	credentials: {
		type: process.env.type,
		project_id: process.env.project_id,
		private_key_id: process.env.private_key_id,
		private_key: process.env.private_key.replace(/\\n/g, "\n"),
		client_email: process.env.client_email,
		client_id: process.env.client_id,
		universe_domain: process.env.universe_domain,
		auth_uri: process.env.auth_uri,
		token_uri: process.env.token_uri,
		auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
		client_x509_cert_url: process.env.client_x509_cert_url,
	},
});

app.get("/", (req, res) => {
	res.send("Server is running!");
});

app.post("/uploadImage", upload.single("profile"), async (req, res) => {
	const bufferStream = new stream.PassThrough();
	bufferStream.end(req.file.buffer);

	// google drive upload
	const { data } = await google
		.drive({
			version: "v3",
			auth,
		})
		.files.create({
			media: {
				mimeType: req.file.mimetype,
				body: bufferStream,
			},
			requestBody: {
				name: `${req.file.fieldname}`,
				parents: ["1rrGr6Ae-wdMNeC18tenh3JhMfUQ3y9wp"],
			},
			fields: "id,name",
		});

	res.send(`Image Link: https://drive.google.com/uc?id=${data.id}`);
});

app.listen(PORT, () => {
	console.log(`Server running at port: http://localhost:${PORT}`);
});
