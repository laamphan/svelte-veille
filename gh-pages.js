var ghpages = require('gh-pages');

ghpages.publish(
    'public', // path to public directory
    {
        branch: 'gh-pages',
        repo: 'https://github.com/laamphan/svelte-veille.git', // Update to point to your repository  
        user: {
            name: 'Thanh Lam Phan', // update to use your name
            email: 'thanh-lam.phan@etu.u-bordeaux.fr' // Update to use your email
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)
