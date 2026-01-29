import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
        courses: './courses.html',
        about: './about.html',
        contact: './contact.html',
        signin: './signin.html',
        signup: './signup.html',
        account: './account.html',
        'course-player': './course-player.html',
        'private-tutoring': './private-tutoring.html',
        privacy: './privacy.html',
        terms: './terms.html',
        'payment-success': './payment-success.html',
        'forgot-password': './forgot-password.html',
        'reset-password': './reset-password.html'
      }
    }
  }
})




