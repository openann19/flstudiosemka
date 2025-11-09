# Deployment Guide

This guide covers deploying the FL Studio Web DAW to various environments.

## Prerequisites

- Node.js 18.x or 20.x
- npm or yarn package manager
- Git

## Environment Setup

1. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

2. Configure environment variables for your deployment.

## Build for Production

```bash
# Install dependencies
npm ci --legacy-peer-deps

# Run production build
npm run build
```

The build output will be in the `dist/` directory.

## Deployment Options

### Option 1: Docker Deployment (Recommended)

**Prerequisites:**
- Docker installed
- Docker Compose (optional)

**Steps:**

1. Build the Docker image:
   ```bash
   docker build -t fl-studio-web .
   ```

2. Run the container:
   ```bash
   docker run -d -p 8000:80 --name fl-studio fl-studio-web
   ```

Or using Docker Compose:
```bash
docker-compose up -d
```

The application will be available at `http://localhost:8000`

**Health Check:**
```bash
curl http://localhost:8000/health
```

### Option 2: Static Hosting (Netlify, Vercel, etc.)

**For Netlify:**

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify deploy --prod --dir=dist
   ```

**For Vercel:**

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

### Option 3: Traditional Server (Nginx)

1. Build the application:
   ```bash
   npm run build
   ```

2. Copy `dist/` contents to your web server directory:
   ```bash
   sudo cp -r dist/* /var/www/html/
   ```

3. Configure Nginx (see `nginx.conf` for reference)

4. Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

### Option 4: GitHub Pages

1. Add to `package.json`:
   ```json
   {
     "homepage": "https://yourusername.github.io/repository-name"
   }
   ```

2. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

3. Add deploy script:
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

## Configuration

### Nginx Configuration

See `nginx.conf` for a production-ready Nginx configuration that includes:
- Gzip compression
- Security headers
- Static asset caching
- SPA routing support
- Health check endpoint

### Security Headers

Ensure these headers are set in production:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: no-referrer-when-downgrade`

### SSL/TLS

For production, always use HTTPS:

**With Let's Encrypt:**
```bash
sudo certbot --nginx -d yourdomain.com
```

**With custom certificate:**
Update Nginx configuration to include SSL certificates.

## Performance Optimization

### Compression

Enable gzip or brotli compression on your server:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### Caching

Set appropriate cache headers:
- HTML: `Cache-Control: no-cache`
- JS/CSS: `Cache-Control: public, max-age=31536000, immutable`
- Images: `Cache-Control: public, max-age=31536000`

### CDN Integration

For better performance, serve static assets from a CDN:
1. Upload `dist/assets/` to your CDN
2. Update asset URLs in your build configuration

## Monitoring

### Health Checks

The application includes a health check endpoint at `/health`:
```bash
curl http://your-domain.com/health
# Response: healthy
```

### Logging

Configure logging based on your infrastructure:
- Application logs: Check browser console
- Server logs: Check Nginx/Apache logs
- Error tracking: Consider Sentry integration

## Troubleshooting

### Build Fails

1. Clear cache and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

2. Check Node.js version:
   ```bash
   node --version  # Should be 18.x or 20.x
   ```

### Audio Not Working

1. Ensure HTTPS is used (Web Audio API requires secure context)
2. Check browser compatibility
3. Verify Audio Context initialization

### Performance Issues

1. Enable production mode
2. Verify compression is enabled
3. Check network tab for large asset downloads
4. Enable browser caching

## Rollback

To rollback a Docker deployment:
```bash
docker stop fl-studio
docker rm fl-studio
docker run -d -p 8000:80 --name fl-studio fl-studio-web:previous-tag
```

For static hosting, redeploy the previous build.

## Backup

Backup critical configuration files:
- `.env` (without committing to repository)
- `nginx.conf`
- SSL certificates
- Custom configuration files

## Updates

To update the application:

1. Pull latest changes:
   ```bash
   git pull origin main
   ```

2. Install dependencies:
   ```bash
   npm ci --legacy-peer-deps
   ```

3. Rebuild:
   ```bash
   npm run build
   ```

4. Redeploy using your chosen method

## Support

For deployment issues:
- Check GitHub Issues
- Review logs for errors
- Consult the troubleshooting section
- Open a new issue with deployment details

## Production Checklist

- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] Security headers set
- [ ] Compression enabled
- [ ] Caching configured
- [ ] Health checks working
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Performance tested

---

For more information, see the main [README.md](README.md)
