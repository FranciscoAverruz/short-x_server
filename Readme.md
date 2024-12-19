# Short-X 
## **📎Link Shortening API with Real-Time Updates**

<p align="center">
  <img src="/assets/banner.webp" alt="Banner readme" width="1000">
</p>

## **🔗 This API allows you to:**
- Shorten URLs and retrieve detailed statistics for them.
- Receive real-time updates via WebSocket functionality, making it easy to monitor changes to URLs and user statistics as they happen.
    
🔧 **Tech Stack**

- 🟩 Built with **Node.js** 
- ⚡ Powered by **Express** 
- 📧 Email functionality using **Nodemailer** 


## 🔑 Key Features

- **Link Shortening**: Easily shorten long URLs for easier sharing.
- **URL Statistics**: Retrieve detailed analytics for each shortened URL, including clicks, views, and other relevant metrics.
- **Real-Time Updates**: Receive live notifications about updates to URL and user statistics using WebSocket.

## ⚡ API Overview

The complete documentation of the API endpoints is available in Swagger. You can access it once the server is running at the following URL:

   - [https://short-x.onrender.com/api-docs](https://short-x.onrender.com/api-docs)

Swagger provides a detailed description of the following aspects:

   - **Endpoints** available for managing URLs, users, and statistics.
   - **Parameters** and **expected responses**.
   - **Authentication** using JWT tokens.
   - **Interactive examples** to test the endpoints directly.

## 🗂️ Overview of Project Directory Structure

The project is organized as follows:

```bash
    ├── 📂config                      # Global configuration
    │   └── messages.js                # Configuration for application messages
    ├── 📂features                    # Core features of the application
    │   ├── 📂admin                   # Admin management (routes, controllers)
    │   ├── 📂auth                    # Authentication and authorization (routes, controllers)
    │   ├── 📂clicks                  # Click management (models, controllers)
    │   ├── 📂stats                   # Statistics (controllers, routes)
    │   ├── 📂templates               # Email templates (password reset, user registration)
    │   ├── 📂urls                    # URL management (models, controllers, routes)
    │   └── 📂users                   # User management (models, controllers, routes)
    ├── 📂github                      # GitHub Actions for workflows
    │   └── delete-user-task.yml       # Workflow for user deletion
    ├── 📂middlewares                 # Middleware for validation and security
    ├── 📂openApi                     # OpenAPI specification for the API
    ├── 📂sockets                     # WebSocket connection and handling
    ├── 📂utils                       # Utility functions (email, pagination, password utils, etc.)
    ├── app.js                         # Main entry point of the application
    ├── index_openapi.js               # Merges multiple YAML files into a single index.yaml for OpenAPI.
    └── package.json                   # Dependency configuration file
```
## 📋 Requirements

Before running the project, make sure your system meets the following requirements:

- **Node.js** (Recommended version: 14.x or higher)
- **npm** (Node Package Manager) or yarn

## 🛠️ Technologies Used
- **Node.js**: The runtime environment for the application.
- **Express.js**: The web framework to handle `HTTP` requests and routing.
- **MongoDB**: NoSQL database used for storing user data, URLs, and other related information.
- **Nodemailer**: Used to send emails for user registration, password reset, and notifications.
- **Swagger/OpenAPI**: API documentation to describe and test the API endpoints.
- **Socket.IO**: Enables real-time communication for certain features of the application.
- **JWT (JSON Web Token)**: For secure authentication and session management.

## 🌍 WebSocket - Real-Time Updates
The application uses Socket.IO to provide real-time updates. This allows clients to receive automatic notifications when changes occur in URL or user statistics.

- ### **WebSocket initialization**

    The basic Socket.IO configuration is located in ` sockets/socket.js ` and is initialized in ` app.js `:

    ```javascript
        const { initSocket } = require("./sockets/socket");
        const server = http.createServer(app);

        initSocket(server);
    ```
    #### How WebSockets Work
    - **Connection**: When a client connects to the server, a welcome message is emitted.
    - **Disconnection**: A message is logged when a client disconnects.
    - **Statistics Update**: From the statistics controllers ` getUrlStats.controller.js ` and ` getUserStats.controller.js `, WebSocket events are emitted to notify changes.

- ### **Emitted Events**

    | **Event**            | **Description**                                    | 
    |:---------------------|:---------------------------------------------------|
    | ` urlStatsUpdated `  | Emitted when the statistics of a URL are updated.  |
    | ` userStatsUpdated ` | Emitted when the statistics of a user are updated. |
    | ` message `          | Used to receive general messages from the server.  |


    #### Example of Event Reception on the Client
    Clients can listen for these events to receive real-time updates. Here is an example of client-side code:

    ```javascript
        import { io } from "socket.io-client";

        // Determine the WebSocket server URL based on the environment (development or production).
        const socketUrl = process.env.NODE_ENV === "production" 
            ? "https://your-dommain-in-production.com"  // Replace it with your production URL.
            : "http://localhost:3500";  // In development, use localhost.

        // Connect to the WebSocket server using the determined URL.
        const socket = io(socketUrl);

        // Listen for URL statistics update events.
        socket.on("urlStatsUpdated", (data) => {
            console.log("URL stats updated:", data);
        });

        // Listen for user statistics update events.
        socket.on("userStatsUpdated", (data) => {
            console.log("User stats updated:", data);
        });
    ```

## 🚀 Getting Started

Follow these steps to set up and run the backend server:

1. ### **Clone the repository**

    ```bash
        git clone https://github.com/FranciscoAverruz/linkshortener_server
        
        cd portfolioEmailServer
    ```

2. ### **Install dependencies**

    Run the following command to install the necessary dependencies:

    ```bash
        npm install
    ```

3. ### **Set up environment variables**

    Before running the application, create a `.env` file in the root directory and make sure to set the following environment variables:

    ```bash
        #🌐 Environment setting
            NODE_ENV= development               # Set to 'production' in the live environment
            CLIENT_URL= https://fron_end.com/   # URL of the frontend application in production, in this project https://short-x.netlify.app/
            PORT=                               # Port the application will run on

        #🗄️ Database Configuration
            MONGO_URI=                          # MongoDB connection URI

        #🔒 Security and Authentication
            JWT_SECRET=                         # Secret key for JWT authentication
            API_PASSWORD=                       # Password used for API authentication in the GitHub workflow.

        #📧 Email credentials
            EMAIL_USER= your-email@gmail.com    # Replace with The email address that will be used to send messages. (e.g., Gmail, SMTP service email)
            EMAIL_PASS= your-email-password     # Replace with your email password or App password
            EMAIL_HOST= smtp.gmail.com          # Replace with the SMTP server host (e.g., smtp.gmail.com for Gmail)
    ```
> [!Important]
> Do not push your `.env` file to a public repository. Add `.env` to `.gitignore`.

4. ### **Email Provider Configuration**

    If you use **Gmail** as your email provider, ensure you take the following steps to allow your application to send emails securely:

    - **Enable SMTP Access**:
        You will need to either allow **Less secure apps** (not recommended) or generate an **App password** for better security.

    - **Generate an App Password**:
        Follow this [guide on the Google Support website](https://support.google.com/accounts/answer/185833?hl=en) to generate an App password. This allows you to use your Gmail account securely without compromising your primary password.

    - **Nodemailer Setup for Gmail**:
        Refer to the [Nodemailer documentation on using Gmail](https://nodemailer.com/usage/using-gmail/) for detailed instructions on configuring **Gmail** with **Nodemailer**.

> [!Note]
> For other email providers, refer to their documentation to enable SMTP access.
> For additional help, refer to the [NodeMailer documentation](https://nodemailer.com/about/index.html).

5. ### **MongoDB Connection Setup**

    - To connect your application to **MongoDB**, use the `URI` provided by **MongoDB Atlas**. You just need to replace the password in the placeholder, here is an example of how it looks:

        ```bash
        mongodb+srv://<user>:<password>@<cluster(eg: cluster0.akirm.mongodb.net)>/?retryWrites=true&w=majority&appName=<DataBaseName>
        ```

    - Once you have your **MongoDB URI** from **MongoDB Atlas** (with the <PASSWORD> placeholder replaced by your actual password), Assign the **complete MongoDB URI value** to the **MONGO_URI variable** that you have defined in the `.env` file.


> [!IMPORTANT] 
> ***Remember, the password must be the same one you created when setting up the user in MongoDB Atlas.***

6. ### **check GitHub Workflow**: Scheduled Account Deletion Task

    This project includes an automated **GitHub Actions workflow** that handles the scheduled deletion of user accounts. This workflow runs periodically and ensures that user accounts marked for deletion are automatically removed.

    - **Frequency**: 
        The workflow is configured to run at midnight every day (0 0 * * *), using the cron syntax. This means it will execute once a day.

    - **Deletion Process**:

        1. **Repository Checkout**: First, GitHub Actions checks out the repository to ensure it has access to the latest version of the project files.

        2. **Account Deletion Request**: Then, the workflow makes an HTTP DELETE request to an external API responsible for processing the account deletion. The request includes an authorization token for authentication.

        3. **Confirmation**: Finally, the workflow prints a confirmation message indicating whether the accounts were successfully deleted or if there was an error in the process.

    - **Ensuring the Proper Functioning of the Workflow**:

        - To ensure the scheduled account deletion task works properly, you need to configure the following required secrets in your GitHub repository.

            **API_http**: 
                - The **URL** of the `API endpoint` responsible for processing the deletion requests.
                - **Example**: (in this project) https://short-x.onrender.com/delete-accounts

            **API_PASSWORD**: 
                - The **password** required in the middleware to authenticate the deletion requests.


        - ### **How to Add Secrets in GitHub**
            1. Go to your **repository** on **GitHub**.
            2. Click on **Settings** > **Secrets and variables** > **Actions**.
            3. Click **New repository secret** to add each secret:

                ```bash
                    Name: API_HTTP
                    Value: https://your-api.com/delete-account

                    Name: API_PASSWORD
                    Value: your_secure_password
                ```

        - **Automatic Trigger**: 
            This workflow is set to trigger automatically every day. Once the secrets are configured, GitHub Actions will handle the execution automatically without manual intervention.

        - **Review Workflow Runs**: 
            You can monitor the workflow runs history in the Actions tab of your GitHub repository. Here, you will be able to see if the deletions were successful or if any errors occurred during the process.

> [!WARNING]
> Be aware that this workflow will automatically delete accounts. Make sure the deletion logic is correctly set up to avoid deleting unwanted accounts.

7. ### **Start the server**

    To start the server in development mode with `nodemon` (which auto-restarts the server when changes are made), run:

    ```bash
        npm start
    ```

    **This command does the following:**

    - **Runs index_openapi.js**: 
        This script is executed first. It initializes or sets up any necessary configurations for the OpenAPI specification.

    - **Resolves JSON References for OpenAPI**: 
        After running index_openapi.js, the command runs json-refs resolve openapi/openapi.yaml > openapi/output.yaml. This command processes the OpenAPI specification file (openapi/openapi.yaml), resolving any $ref references to produce a complete OpenAPI definition. The output is saved to openapi/output.yaml.

    - **Starts the Server Using nodemon**: 
        Finally, the command starts the server using nodemon app.js. nodemon is a development tool that watches for file changes and automatically restarts the server to reflect those changes. This makes development faster and more efficient.

    - **Creates the Admin User**: 
        The **createAdmin()** function is executed after the connection is established. This function is used to create an initial admin user in the database (if not already created). The success of the admin creation is logged with the message: **"Admin creation script executed"**.

> [!NOTE]
> **Once the server is up** it will be available at ` http://localhost:3500 ` or the port configured in your ` .env ` file, and you will be able to:
>   - Access the API documentation in Swagger: [http://localhost:3500/api-docs](http://localhost:3500/api-docs)
>   - Establish a WebSocket connection to receive real-time updates. Refer to the [WebSocket - Real-Time Updates](#websocket---real-time-updates) section for more details.

8. ### **Error Handling**

    The API handles common errors using standard HTTP status codes:
    - **400 Bad Request**: The request could not be processed due to invalid or duplicated input, missing parameters, or mismatched data.
    - **401 Unauthorized**: You are not authorized to access this resource. Please log in and try again.
    - **404 Not Found**: The requested resource could not be found. Please check the provided data and try again.
    - **500 Server Error**: An unexpected error occurred on the server. Please try again later.

    #### **WebSocket Errors**

    - **CORS Policy Error**
        - **Location**: In the `cors` configuration of `initSocket()`.
        - **Trigger**: When the frontend URL is not allowed by the CORS policy.
        - **Solution**: Update `origin` to the correct frontend URL in production.

    - **Timeout Error**
        - **Location**: In the `pingTimeout` and `pingInterval` settings of `initSocket()`.
        - **Trigger**: When the server doesn’t receive a ping response within the timeout period.
        - **Solution**: Adjust `pingTimeout` and `pingInterval` to allow longer intervals if necessary.

    - **Connection Refused**
        - **Location**: In the connection event (`io.on("connection")`).
        - **Trigger**: When the client cannot connect due to server issues or incorrect URL.
        - **Solution**: Ensure the server is running and the client uses the correct URL.

    - **Transport Close**
        - **Location**: In `socket.on("disconnect")`.
        - **Trigger**: When the connection closes unexpectedly.
        - **Solution**: Handle the disconnect event gracefully.

    - **403 Forbidden**
        - **Location**: In `socket.on("error")`.
        - **Trigger**: When the client lacks permission to connect.
        - **Solution**: Implement proper authentication and authorization.

    - **Socket.io Not Initialized**
        - **Location**: In `getIo()`.
        - **Trigger**: When `getIo()` is called before `initSocket(server)`.
        - **Solution**: Ensure `initSocket(server)` is called during initialization.

### 💡 Additional Considerations:
- Ensure that the **WebSocket server** is set up to accept connections from **specific domains** when working in **production**. This can be done by configuring **CORS** on the **WebSocket server** (`io.origins(...)`).
- If you're using a **production environment** with **HTTPS**, remember to change the protocol on the client to `wss://` to work with **SSL security**.
- Always handle **disconnect** and **reconnect** events properly in both the **server** and **client** to improve user experience.