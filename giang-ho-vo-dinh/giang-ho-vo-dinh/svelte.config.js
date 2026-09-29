import adapter from '@sveltejs/adapter-vercel';

export default {
  kit: {
    adapter: adapter({ runtime: 'nodejs24.x' }),
    alias: {
      $core: 'src/lib/core',
      $engine: 'src/lib/engine',
      $world: 'src/lib/world',
      $combat: 'src/lib/combat',
      $content: 'seeds'
    }
  }
};
