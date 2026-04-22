const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // You may need to run: npm install uuid

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
const SITE_PATH = path.join(__dirname, '../site');
const JSON_PATH = path.join(SITE_PATH, 'building_v2.json');
const MAX_IMAGES_PER_ROOM = 5;

// --- USER & ROLE REGISTRY ---
const USERS = {
    "key_admin_99": { name: "Super Admin", role: "admin" },
    "key_user_45": { name: "Regular Artist", role: "user" },
    "key_guest_01": { name: "Visitor", role: "guest" }
};

// --- MIDDLEWARE: RBAC ---
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        const userKey = req.header('x-api-key');
        const user = USERS[userKey];
        if (!user) return res.status(401).json({ error: "Invalid API Key." });

        if (allowedRoles.includes(user.role)) {
            req.user = user;
            next();
        } else {
            res.status(403).json({ error: `Forbidden: ${user.role} access denied.` });
        }
    };
};

// --- SWAGGER SETUP ---
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: { title: 'Virtual Gallery Pro API', version: '1.3.0' },
        servers: [
            {
                url: 'https://your-azure-app-name.azurewebsites.net', // Replace with your actual Azure URL
                description: 'Production server'
            },
            {
                url: 'http://localhost:3000',
                description: 'Local development'
            }
        ],
        components: {
            securitySchemes: { ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' } }
        },
        security: [{ ApiKeyAuth: [] }],
    },
    apis: [__filename],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const upload = multer({ dest: path.join(SITE_PATH, 'temp_uploads') });

/**
 * @openapi
 * /upload:
 *   post:
 *     summary: Upload image with Unique ID (Admin/User)
 *     requestBody:
 *       content:
 *        multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully with assigned ID and room.
 */
app.post('/upload', authorize(['admin', 'user']), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No file.');

        const data = await fs.readJson(JSON_PATH);
        const artId = `art_${uuidv4().split('-')[0]}`; // Short unique ID

        let targetGallery = "gallery3";
        let galleryIndex = 3;
        while (data[targetGallery]) {
            const artCount = Object.keys(data[targetGallery]).filter(k => data[targetGallery][k].resource_type === 'image').length;
            if (artCount < MAX_IMAGES_PER_ROOM) break;
            galleryIndex++;
            targetGallery = `gallery${galleryIndex}`;
        }

        if (!data[targetGallery]) {
            data[targetGallery] = { "parent": "root", "resource": "gallery3.glb", "template": "T_nopannels.glb", "root": { "resource": "root.glb", "resource_type": "door" } };
            data.root[targetGallery] = { "resource": `${targetGallery}.glb`, "resource_type": "door" };
            await fs.ensureDir(path.join(SITE_PATH, targetGallery));
        }

        const fileName = `${artId}${path.extname(req.file.originalname)}`;
        const finalPath = path.join(SITE_PATH, targetGallery, fileName);
        await fs.move(req.file.path, finalPath);

        const currentArtCount = Object.keys(data[targetGallery]).filter(k => data[targetGallery][k].resource_type === 'image').length;
        const xOffset = (currentArtCount * 4) - 8;

        data[targetGallery][artId] = {
            "resource": `/${targetGallery}/${fileName}`,
            "resource_type": "image",
            "width": "1.00",
            "height": "1.00",
            "location": `[${xOffset}.000, -20.000, 2.000]`,
            "vector": "[0.0, 1.0]",
            "metadata": `ID: ${artId} | Owner: ${req.user.name}`
        };

        await fs.writeJson(JSON_PATH, data, { spaces: 2 });
        res.json({ success: true, artId: artId, room: targetGallery });
    } catch (err) {
        res.status(500).send("Upload Failed");
    }
});

/**
 * @openapi
 * /delete-art/{artId}:
 *   delete:
 *     summary: Delete specific image by ID (Admin Only)
 *     parameters:
 *       - in: path
 *         name: artId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Art deleted successfully.
 */
app.delete('/delete-art/:artId', authorize(['admin']), async (req, res) => {
    try {
        const { artId } = req.params;
        const data = await fs.readJson(JSON_PATH);
        let found = false;

        for (const room in data) {
            if (data[room] && data[room][artId]) {
                // GET THE EXACT PATH FROM JSON
                const relativePath = data[room][artId].resource;
                // Combine with SITE_PATH (making sure to handle the leading slash)
                const finalFilePath = path.join(SITE_PATH, relativePath.startsWith('/') ? relativePath.substring(1) : relativePath);

                console.log(`Attempting to delete file at: ${finalFilePath}`);

                // 1. Try to delete the physical file if it exists
                if (await fs.pathExists(finalFilePath)) {
                    await fs.remove(finalFilePath);
                } else {
                    console.warn("File not found on disk, but removing entry from JSON anyway.");
                }

                // 2. Remove from JSON
                delete data[room][artId];
                found = true;
                break;
            }
        }

        if (!found) return res.status(404).json({ error: "Art ID not found in building_v2.json" });

        await fs.writeJson(JSON_PATH, data, { spaces: 2 });
        res.json({ success: true, message: `Deleted ${artId} and its associated file.` });
    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).send("Delete Failed: Check console for path errors.");
    }
});

const PORT = process.env.PORT || 3000; // Use Azure's port or default to 3000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger docs available at /api-docs`);
});
