# Vercel Deployment Guide for ESP32 Air Quality Monitor Dashboard

This guide explains how to deploy the web dashboard to Vercel.

## Prerequisites

- Vercel account (sign up at https://vercel.com)
- Vercel CLI installed: `npm install -g vercel`
- Completed Firebase setup with your project
- Environment variables configured for your Firebase project

## Environment Variables Setup

Before deploying to Vercel, you need to set up your Firebase environment variables:

1. Create a `.env.local` file in your `dashboard/` directory with your Firebase configuration:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
```

2. In your Vercel dashboard, go to your project settings and add these same environment variables under "Environment Variables".

## Deployment Steps

### 1. Navigate to Dashboard Directory
```bash
cd dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Application
```bash
npm run build
```

### 4. Deploy to Vercel
```bash
# For a preview deployment
vercel

# For a production deployment
vercel --prod
```

### 5. Link to Git Repository (Alternative Method)
1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. In the Vercel dashboard, import your project
3. Vercel will automatically detect this is a Next.js project and build it accordingly
4. Make sure your environment variables are set in the Vercel project settings

## Configuration Notes

- The `vercel.json` file in the dashboard directory configures how Vercel builds and serves your Next.js application
- The `next.config.js` file is configured for optimal Vercel deployment
- Your dashboard will communicate with the same Firebase backend as configured in your environment variables

## Troubleshooting

### Common Issues:

1. **Deployment fails due to missing environment variables**
   - Ensure all required Firebase environment variables are set in the Vercel dashboard

2. **Firebase connection errors after deployment**
   - Check that your Firebase project allows connections from your Vercel deployment URL
   - Verify that your Firebase security rules allow the deployed application to read/write data

3. **Static export issues**
   - This project uses Next.js dynamic rendering, not static export, so ensure your Vercel configuration reflects this

## Post-Deployment

After successful deployment:
1. Note the deployment URL provided by Vercel
2. Ensure your ESP32 device is still properly configured to work with the same Firebase backend
3. Test all dashboard functionality with real data from your ESP32 device
4. Update your documentation with the new production URL

## Scaling and Maintenance

- Monitor Firebase usage as your Vercel deployment scales
- Set up custom domain if desired through the Vercel dashboard
- Configure automated deployments from your Git repository for easier updates