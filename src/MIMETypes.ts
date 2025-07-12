export function MIMETypeFromExtension(filename: string) {
	var dotSeperatorIdx = filename.lastIndexOf('.');
	if (dotSeperatorIdx == -1)
		return "application/octet-stream";
	
	var ext = filename.slice(dotSeperatorIdx+1);
	
	switch (ext.toLowerCase()) {
		// Text
		case "txt": return "text/plain";
		case "gmi":
		case "gemini":
		case "gemtext": return "text/gemini";
		case "html":
		case "htm": return "text/html";
		case "css": return "text/css";
		case "js": return "text/javascript";
		case "csv": return "text/csv";
		case "xml": return "text/xml";
		case "md": return "text/markdown";

		// Image
		case "jpg":
		case "jpeg": return "image/jpeg";
		case "png": return "image/png";
		case "gif": return "image/gif";
		case "webp": return "image/webp";
		case "svg": return "image/svg+xml";
		case "bmp": return "image/bmp";
		case "tif":
		case "tiff": return "image/tiff";
		case "ico": return "image/x-icon";
		case "heif":
		case "heic": return "image/heif";
		case "avif": return "image/avif";

		// Audio
		case "mp3": return "audio/mpeg";
		case "wav": return "audio/wav";
		case "ogg": return "audio/ogg";
		case "weba": return "audio/webm";
		case "aac": return "audio/aac";
		case "flac": return "audio/flac";
		case "midi":
		case "mid": return "audio/x-midi";
		case "3gp": return "audio/3gpp";
		case "3g2": return "audio/3gpp2";

		// Video
		case "mp4": return "video/mp4";
		case "avi": return "video/x-msvideo";
		case "mkv": return "video/x-matroska";
		case "webm": return "video/webm";
		case "ogv": return "video/ogg";
		case "mov": return "video/quicktime";
		// 3gp/3g2 handled above for audio too

		// Application / Documents
		case "json": return "application/json";
		case "pdf": return "application/pdf";
		case "zip": return "application/zip";
		case "tar": return "application/x-tar";
		case "gz": return "application/gzip";
		case "7z": return "application/x-7z-compressed";
		case "doc": return "application/msword";
		case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
		case "xls": return "application/vnd.ms-excel";
		case "xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
		case "ppt": return "application/vnd.ms-powerpoint";
		case "pptx": return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
		case "swf": return "application/x-shockwave-flash";
		case "php": return "application/x-httpd-php";
		case "py": return "application/x-python-code";
		case "pl": return "application/x-perl";
		case "jar": return "application/x-java-archive";
		case "wasm": return "application/wasm";

		// Special / ambiguous
		default: return "application/octet-stream";
	}
}