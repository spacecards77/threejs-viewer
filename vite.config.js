import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
    return {
        base: command === 'build' ? '/threejs-viewer/' : './'
    };
});
