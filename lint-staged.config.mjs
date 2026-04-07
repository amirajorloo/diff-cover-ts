export default {
  '*.ts': ['eslint --fix', 'prettier --write'],
  '*.{json,md,toml}': ['prettier --write'],
}
