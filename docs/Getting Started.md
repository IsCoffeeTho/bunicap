# Getting Started

> **bunicap** is a minimalist, high-performance framework for building [Gemini](https://geminiprotocol.net/) capsules using [Bun](https://bun.sh). It provides routing, request/response abstractions, and TLS support out of the box, enabling you to focus on your capsule logic.

## Index

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Core Concepts](#core-concepts)
   - [Request Object](#request-object)
   - [Response Object](#response-object)
   - [Routing & Handlers](#routing--handlers)
   - [TLS Support](#tls-support)
5. [Usage Example](#usage-example)
6. [Configuration & Scripts](#configuration--scripts)
7. [Creating Your Own Gemini Capsule](#creating-your-own-gemini-capsule)

## Overview

bunicap wraps Bun’s low-level TCP/TLS server to implement the Gemini protocol, offering:

- **Routing** with static, parametric (`:id`) & wildcard (`*`) paths
- **Request parsing** into a simple `geminiRequest` object
- **Response helpers** (`send`, `redirect`, `sendFile`) via `geminiResponse`
- **TLS support** for secure capsules (or omit when behind a TLS proxy)

At its core, `bunicap` is a single class with intuitive methods to define routes and start listening for Gemini clients.

## Installation

```bash
bun install bunicap
```

## Quick Start

```ts
import bunicap from "bunicap";

const capsule = new bunicap({
  tls: {
    key: Bun.file(`${__dirname}/localhost.key`),
    cert: Bun.file(`${__dirname}/localhost.crt`),
  },
});

capsule
  .path("/", (req, res) => {
    res.send("# Hello from bunicap!\nWelcome to Gemini.");
  })
  .listen("0.0.0.0", 1965, (capsule) => {
    console.log("Gemini capsule running on", capsule.hostname, capsule.port);
  });
```

## Core Concepts

### Request Object

- **hostname**: target host
- **endpoint**: path (e.g. `/foo/bar`)
- **params**: populated from `:param` routes
- **input**: raw query string (`?search=…`)
- **state**: lifecycle (`BEGIN` → `PROCESSING` → `CLOSED`)
- **sent**: whether response has been dispatched

### Response Object

| Method                   | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| **requireCertificate()** | Signal client to present a certificate (60)            |
| **status(code)**         | Sets the response code                                 |
| **type(mime)**           | Sets the MIME Type of the response                     |
| **redirect(uri)**        | Status Code **3x** redirect and terminate              |
| **send(data)**           | Sends data as either the response message or body data |
| **sendFile(...)**        | Sends file and informs client of the type of data      |

| Status Code | Meaning                      |
| ----------- | ---------------------------- |
| 10-19       | Input Required               |
| 20-29       | OK                           |
| 30-39       | Redirects                    |
| 40–49       | Temporary errors             |
| 50–59       | Permanent errors             |
| 60–69       | Certificate-related statuses |

See [Gemini Status Codes](https://geminiprotocol.net/docs/protocol-specification.gmi#status-codes) for more information

### Routing & Handlers

- `.path(endpoint, (req, res[, next]) => any)`  
  Register a handler for:

  - **Static** paths (`"/about"`)
  - **Parametric** paths (`"/user/:id"`) → provides `req.params.id`
  - **Wildcard** paths (`"/assets/*"`) → prefix matching

- `.use([path, ]capsule)`  
  Intended for mounting sub-capsules at a base path.

- `.listen(address, port[, callback])`
  invokes a private `trickleRequest` pipeline:
  1. **Match** routes via `#getRoutes`
  2. **Populate** params for parametric routes
  3. **Invoke** each handler in order
  4. **Respect** `next()` calls to continue chaining
  5. **Fallback** to `NotFound` if no handler claims the request

### TLS Support

Pass TLS credentials to **encrypt** your capsule:

```ts
new bunicap({
  tls: {
    key: Bun.file("key.pem"),
    cert: Bun.file("crt.pem"),
  },
});
```

Omit `tls` when running behind a reverse proxy that handles encryption.

## Configuration & Scripts

In **package.json**:

```json
{
  "scripts": {
    "start": "bun run example.ts",
    "encrypt": "openssl req -x509 -out localhost.crt -keyout localhost.key ..."
  }
}
```

- `npm run encrypt`: generate a self-signed cert for local testing
- `npm start`: launch the sample capsule

## Creating Your Own Gemini Capsule

1. **Generate TLS cert** (or skip if using a proxy):
   ```bash
   npm run encrypt
   ```
2. **Instantiate** bunicap in `app.ts`:

   ```ts
   import bunicap from "bunicap";
   import { Bun } from "bun";

   const app = new bunicap({
     tls: {
       // or omit if running behind a reverse proxy
       key: Bun.file("localhost.key"),
       cert: Bun.file("localhost.crt"),
     },
   });
   ```

3. **Define routes**:

   ```ts
   app.path("/", (req, res) => {
     res.send("# Welcome\nThis is my Gemini capsule!");
   });

   app.path("/user/:id", (req, res) => {
     res.send(`# User Profile\nID: ${req.params.id}`);
   });
   ```

4. **Start listening**:
   ```ts
   app.listen("0.0.0.0", 1965, () => {
     console.log("Running on port 1965");
   });
   ```

Your capsule is now live at `gemini://localhost:1965/`!
