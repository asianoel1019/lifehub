import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	optimizeDeps: {
		include: ['@capacitor/core', '@capacitor/http']
	},
 	server: {
		host: true,        // listen on 0.0.0.0
		port: 8080,        // use port 8080
		allowedHosts: true,
	}
})
