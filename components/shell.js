import fs from 'fs';

const options = {
  filesystem: './files'
};

// Prevent exploits
const sanitize = (string) => {
  // Poision null byte
  if (string.indexOf('\0') !== -1) {
    return '';
  }

  // Force alphanumerics
  return string.replace(/\W+/g, ' ');
};

// Commands
const map = {
  // List contents of directory
  ls() {
    return fs.readdirSync(options.filesystem).join('\t');
  },

  // Print contents of file
  cat(data) {
    const file = data.args && data.args[0];

    // Ensure a file was passed as an argument
    if (!file) {
      return '';
    }

    const sanitized = sanitize(file);

    // Ensure file exists
    try {
      fs.statSync(`${options.filesystem}/${sanitized}`);

      return fs.readFileSync(`${options.filesystem}/${sanitized}`, 'utf8');
    } catch (e) {
      return `${sanitized}: No such file or directory`;
    }
  },

  // Print a string
  echo(data) {
    const string = data.args && data.args[0];

    // Ensure a string was passed as an argument
    if (!string) {
      return '\n';
    }

    return string.replace(/["'\\]/g, '').replace('<', '&lt;').replace('>', '&gt;');
  }
};

// Process "shell" command
export function process(input, id) {
  const pieces = input.split(' ');
  const command = pieces[0];
  const args = pieces.slice(1);

  if (map[command]) {
    return map[command]({
      id,
      args
    });
  }

  return null;
}
