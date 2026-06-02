module.exports = {
  apps: [{
    name: 'xiozy-bot',
    script: './src/index.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    restart_delay: 3000,
    max_restarts: 10,
    env: {
      NODE_ENV: 'production',
    },
  }],
};
