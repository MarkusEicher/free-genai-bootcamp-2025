# Installation instructions

## Prerequisites

- Node.js (v18 or higher)
    We recommend using nvm to install Node.js on Linux, and nvm-windows to install Node.js on Windows. In this case we will install the latest LTS version of Node.js 22.14.0.
    
    ### Linux commands:
    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
    source ~/.bashrc
    nvm install --lts
    ```
    ### Windows commands:

    > Go to the nvm-windows GitHub repository: https://github.com/coreybutler/nvm-windows
    Download the latest nvm-setup.exe file from the releases section.
    Run the installer and follow the prompts. The default settings are usually fine.
     https://github.com/coreybutler/nvm-windows/releases

    For the rest of the instructions use an elevated PowerShell terminal.

    ```bash
    nvm install 22
    ```
- Git should be installed too.

## Setup Process

1. Clone the repository
2. Run `npm install` to install the dependencies
3. Run `npm run dev` to start the development server


