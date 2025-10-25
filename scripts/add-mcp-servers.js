#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// Available MCP server configurations
// These are examples - you'll need to install the actual MCP servers
const availableMCPServers = {
  // Example configurations for common MCP servers
  // Uncomment and modify as needed

  // "filesystem": {
  //   "command": "npx",
  //   "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/directory"]
  // },

  // "github": {
  //   "command": "npx",
  //   "args": ["-y", "@modelcontextprotocol/server-github"],
  //   "env": {
  //     "GITHUB_TOKEN": "your-github-token"
  //   }
  // },

  // "brave-search": {
  //   "command": "npx",
  //   "args": ["-y", "@modelcontextprotocol/server-brave-search"],
  //   "env": {
  //     "BRAVE_API_KEY": "your-brave-api-key"
  //   }
  // }
};

function updateMCPConfig() {
  const homeDir = os.homedir();
  const configPath = path.join(homeDir, '.claude.json');

  // Read existing config or create new one
  let config = {};
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(content);
  }

  // Initialize mcpServers if it doesn't exist
  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  // Add MCP servers
  Object.keys(availableMCPServers).forEach(serverName => {
    if (!config.mcpServers[serverName]) {
      config.mcpServers[serverName] = availableMCPServers[serverName];
      console.log(`Added MCP server: ${serverName}`);
    } else {
      console.log(`MCP server already exists: ${serverName}`);
    }
  });

  // Write back the configuration
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('\nMCP configuration updated successfully!');
  console.log(`Configuration file: ${configPath}`);

  // Also update project-specific .mcp.json if needed
  const projectConfigPath = path.join(process.cwd(), '.mcp.json');
  const projectConfig = {
    mcpServers: {}
  };

  fs.writeFileSync(projectConfigPath, JSON.stringify(projectConfig, null, 2));
  console.log(`Project configuration cleared: ${projectConfigPath}`);
}

// Run the update
updateMCPConfig();

console.log('\n📌 Note: MCP servers need to be installed and properly configured.');
console.log('For more information, see: https://docs.claude.com/en/docs/claude-code/mcp');