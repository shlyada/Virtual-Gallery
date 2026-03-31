# IPMD Virtual Gallery
---

## Project Overview

This project is a customized version of the OpenVGAL framework, transformed into a dynamic, managed web application. While the original framework provides the 3D environment, this repository introduces a secure Node.js backend that enables real-time content management and administrative control.

**Key Features**
* **Immersive 3D Environment:** A fully navigable virtual gallery running directly in the browser via the OpenVGAL engine.
* **Documented REST API:** A Node.js backend (located in /backend) featuring API endpoints documented and testable via Swagger (OpenAPI).
* **Dynamic Image Management:**
  * Upload API: Programmatically add new artwork to the gallery.
  * Delete API: Remove specific assets from the gallery storage to update exhibitions on the fly.
* **Granular Authorization:** The backend is configured with distinct permission levels to ensure security:
  * **Admin:** Full access to upload and delete gallery content.
  * **User:** Restricted access (can only upload gallery content)
  * **Guest:** View access to the virtual gallery only
 
**Technical Architecture**
* **Frontend:** HTML5/CSS3 and JavaScript.
* **Backend:** Node.js with Express
* **API Documentation:** Swagger.io
* **Security:** Role-Based Access Control (RBAC for API Endpoints)
---

### Custom Logo

Replace `materials/logo.png` in the ZIP with your own image. Use white artwork on a black background (the white areas glow in the gallery). Recommended size: 1024x512 px, PNG format.

---

## How It Works

OpenVGAL uses a `building_v2.json` file to describe interconnected gallery rooms. Each room references a GLB template and contains items (artworks or doors to other rooms). The viewer loads templates, applies PBR node materials, places artwork textures at calculated positions, and handles navigation between rooms via door meshes.

To initialize the platform, follow the designated instructions for launching both the frontend server and the Node.js backend within your local environment.

For a deeper dive into the JSON format, the layout algorithm, the material system, and how to create custom templates, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Repository Structure

| Directory | | Description |
|-----------|-------------|
| `site/` | Frontend: Landing page and 3D Babylon.js gallery viewer. |
| `backend/` | Management API: Node.js server for image uploads/deletions with RBAC. |
| `cdn/` | Assets: GLB models, textures, and materials used by the viewer. |
| `python/` | Legacy Tools: Original CLI for gallery generation (Internal use only). |
| `examples/` | Samples: Reference galleries for testing layout and lighting. |

### Core Engine and Attribution
This project is built upon the OpenVGAL framework. For in-depth documentation regarding the 3D engine, room generation algorithms, and legacy Python tools, please refer to the original repository: https://github.com/lbartworks/openvgal

**Key Original Components Used**
* site/: Contains the Babylon.js viewer and layout logic.
* cdn/: Contains the GLB models and PBR textures.
* python/: Original CLI for offline gallery generation.

---

## Local Development

To run the full application locally, you will need to start both the frontend gallery server and the backend API service.

1. Start the Virtual Gallery (Frontend) -- The gallery environment is served using Python's built-in HTTP server. Navigate to the site folder and run the following command:

* ```bash
  python3 -m http.server 8080

**Access the Gallery:** Open your browser and navigate to http://localhost:8080/viewer.html

2. Start the Management API (Backend) -- The backend handles image uploads, deletions, and authorization. Open a second terminal window, navigate to the backend folder, and start the Node server:

* ```bash
  node backend.js

**Access API Documentation:** Open your browser and navigate to http://localhost:3000/api-docs/

---

## License

The initial OpenVGAL Repository's License: MIT License. See [LICENSE](LICENSE).

*Based on the original OpenVGAL project by lbartworks*

---
