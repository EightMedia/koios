# Koios taskrunner

## package.json scripts

```
"scripts": {
  "start": "NODE_ENV=development koios server",
  "build": "NODE_ENV=development koios clean styles scripts templates",
  "export": "NODE_ENV=production koios bump clean styles scripts templates"
}
```