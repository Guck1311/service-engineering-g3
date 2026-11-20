import type { StorybookConfig } from '@storybook/vue3-vite'
import remarkGfm from 'remark-gfm'
import type { PluginOption } from 'vite'

const config: StorybookConfig = {
  // Stories live next to the components they show; overview pages are MDX.
  stories: ['../src/**/*.mdx', '../src/**/*.stories.ts'],
  addons: [
    {
      // Docs pages generated from props, events and slots, plus our MDX pages.
      name: '@storybook/addon-docs',
      // GitHub-flavored Markdown (tables) in the MDX pages.
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    '@storybook/addon-a11y', // accessibility checks (contrast, ARIA) for every story
  ],
  framework: '@storybook/vue3-vite',
  // No anonymous usage statistics sent to Storybook's servers.
  core: { disableTelemetry: true },
  // Storybook reuses our vite.config.ts (aliases, SCSS settings). Two adjustments:
  viteFinal(viteConfig) {
    // 1. Relative asset paths, so the static build also works under /storybook/ on GitHub Pages.
    viteConfig.base = './'
    // 2. The Vue DevTools overlay belongs to the app, not to Storybook.
    viteConfig.plugins = (viteConfig.plugins ?? [])
      .flat()
      .filter(
        (plugin: PluginOption) =>
          !(
            plugin &&
            typeof plugin === 'object' &&
            'name' in plugin &&
            plugin.name.startsWith('vite-plugin-vue-devtools')
          ),
      )
    return viteConfig
  },
}

export default config
