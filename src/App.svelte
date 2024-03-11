<script>
  import { Navbar, Nav, NavItem, NavLink } from "sveltestrap";
  
  const color = "white";
</script>
<main>
  <Navbar {color} class="fixed-top navbar-expand-lg navbar-light">
     <img
        class="NavbarBrand"
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Svelte_Logo.svg/1200px-Svelte_Logo.svg.png"
        href="/"
        width="1.5%"
        alt="logo"
        />
     <Nav class="ms-auto mb-2 mb-lg-0">
        <NavItem class="nav-item active">
           <NavLink href="#tutorial">Tutoriel</NavLink>
        </NavItem>
        <NavItem class="nav-item active">
           <NavLink href="#intro">Introduction</NavLink>
        </NavItem>
        <NavItem class="nav-item active">
          <NavLink href="#top">Home</NavLink>
        </NavItem>
    </Nav>
  </Navbar>
  <header class="bg-dark py-5">
     <div class="container px-4">
        <div class="row gx-5 align-items-center justify-content-center">
           <div class="col-lg-8 col-xl-7 col-xxl-6">
              <div class="my-5 text-center text-xl-start">
                 <h1
                    class="display-1 fw-bold pt-5 text-white mb-4 font-monospace"
                    style="letter-spacing: 20px;"
                    >
                    SVELTE
                 </h1>
                 <p
                    class="lead fw-normal text-light mb-5 font-monospace"
                    style="letter-spacing: 3px;"
                    >
                    CYBERNETICALLY ENHANCED<br /> WEB APPS
                 </p>
                 <div
                    class="d-grid gap-3 d-sm-flex justify-content-sm-center justify-content-xl-start"
                    >
                    <a
                       class="btn btn-secondary btn-lg text-white px-4 me-sm-3"
                       href="#intro">Discover</a
                       >
                 </div>
              </div>
           </div>
           <div class="col-xl-5 col-xxl-6 d-none d-xl-block text-center">
              <img
                 class="img-fluid rounded-3 my-5"
                 src="https://svelte.dev/images/twitter-thumbnail.jpg"
                 alt="Svelte illustration"
                 width="60%"
                 />
           </div>
        </div>
     </div>
  </header>
  <section class="content">
     <div class="blog-post">
        <h3 id="intro">C'est quoi Svelte?</h3>
        <p>Svelte est un outil permettant de créer des applications Web <em>rapides</em>. <br>
          
          Il est similaire aux frameworks JavaScript tels que <strong>React</strong> et <strong>Vue</strong>, qui partagent l'objectif de faciliter la création d'interfaces utilisateur interactives fluides. </p>
        
        <p>Mais il y a une différence <em>cruciale</em> : Svelte convertit votre application en JavaScript idéal au moment de la <strong><em>compilation</em></strong>, plutôt que d'interpréter le code de votre application au moment de l'<strong>exécution</strong>. <br> Cela fait une grande différence dans le temps de chargement des sites utilisant Svelte par rapport à ceux utilisant d'autres frameworks volumineux.</p>
        <p>Au lieu d'utiliser des techniques telles que la différenciation virtuelle du DOM, Svelte écrit du code qui met à jour chirurgicalement le DOM lorsque l'état de votre application change.</p>

        <h4>Svelte est aimé et utilisé par</h4>
        <div class="customer-grid">
          <div class="customer">
            <img width=90% src="https://i.imgur.com/06Tta8T.png" alt="brave search site">
            <p class='mt-3'><a href="https://search.brave.com/"><strong>Brave Search</strong></a> - un moteur de recherche qui ne vous suit pas</p>
          </div>
          <div class="customer">
            <img width=90% src="https://i.imgur.com/vRq5Ltl.png" alt="chess.com site">
            <p class='mt-3'><a href="https://chess.com/"><strong>Chess.com</strong></a>  - le plus grand serveur d'échecs sur Internet</p>
          </div>
          <div class="customer">
            <img width=90% src="https://i.imgur.com/myfGGcT.png" alt="radiofrance site">
            <p class='mt-3'><a href="https://www.radiofrance.fr/"><strong>Radiofrance.fr</strong></a> - Écouter radio en ligne.</p>
          </div>
          <div class="customer">
            <img width=90% src="https://i.imgur.com/KtqMyFq.png" alt="the new york times site">
            <p class='mt-3 '><a href="https://www.nytimes.com/"><strong>The New York Times</strong></a> - Quotidien américain basé à New York.</p>
            
          </div>
        </div>


        <h3 id="tutorial">TicTacToe Tutoriel</h3>
        <p>
           Pour montrer quelques fonctionnalités simples mais utiles de <strong
              >Svelte</strong
              >, je voudrais vous guider à travers un mini projet
           <strong>"TicTacToe"</strong>, le jeu que nous connaissons tous
           assez bien lorsque nous regardons des démos.
        </p>
        <p>
           Pour commencer, nous utiliserons degit pour cloner un modèle à partir du
           référentiel Github de Svelte, puis installer les dépendances et serve l'application
        </p>
        <iframe title="init.sh"
           width="100%"
           height="160"
           src="data:text/html;charset=utf-8,
           <head><base target='_blank' /></head>
           <body><script src='https://gist.github.com/laamphan/3b91e0171c80c3f629f1811b8b427057.js'></script>
           </body>"/>
        <p>Prenez 30 secondes pour nettoyer le template <em>Hello World</em> de Svelte. Dans le dossier <strong>src</strong> :</p>
        <ul>
        <li><strong>App.svelte</strong> : supprimer tout sauf 3 balises de base 	<em>&lt;script&gt;, &lt;main&gt;, &lt;style&gt;</em> </li>
        <li><strong>main.js</strong> : supprimer la propriété <em>"name"</em> qui n'est plus utilisé</li>
        </ul>
        <iframe title="clean"
           width="100%"
           height="450"
           src="data:text/html;charset=utf-8,
           <head><base target='_blank' /></head>
           <body><script src='https://gist.github.com/laamphan/997d95bb9268c5857f377be29be83b36.js'></script>
           </body>"/>
        <p>A partir de maintenant, nous n'avons plus qu'à travailler sur notre <strong>App.svelte</strong> . Nous allons commencer par construire l'interface et ses gestionnaires au clic</p>
        <iframe title="main"
        width="100%"
        height="420"
        src="data:text/html;charset=utf-8,
        <head><base target='_blank' /></head>
        <body><script src='https://gist.github.com/laamphan/5cee2a805ee54ad0ecf3eb16ab09b786.js'></script>
        </body>"/>
        <p>Maintenant, nous avons besoin de quelques CSS simples pour afficher la grille 3x3, directement dans la balise <em>&lt;style&gt;</em></p>
        <iframe title="main"
        width="100%"
        height="350"
        src="data:text/html;charset=utf-8,
        <head><base target='_blank' /></head>
        <body><script src='https://gist.github.com/laamphan/a5b1e352cf04039a9e57b38433d04d29.js'></script>
        </body>"/>
        <p>Ensuite, initiez les variables nécessaires dans la balise <em>&lt;script&gt;</em> : </p>
          <ul>
          <li><strong>buttons</strong> : tableau pour stocker l'état actuel de la grille</li>
          <li><strong>result </strong> : stocker la chaîne d'annonce de gain</li>
          <li><strong>turn</strong> : mémoriser le joueur suivant</li>
          <li><strong>winCombinations</strong> : cases qui doivent être remplies par le même joueur pour qu'il soit considéré comme vainqueur</li>
        </ul>
        <iframe title="main"
        width="100%"
        height="400"
        src="data:text/html;charset=utf-8,
        <head><base target='_blank' /></head>
        <body><script src='https://gist.github.com/laamphan/5ef08bc8ef0782b4bd2b31419d97f14d.js'></script>
        </body>"/>
        <p>Il est temps d'écrire la fonction <strong>setValue</strong>. Nous devons vérifier s'il y a quelqu'un qui a déjà joué sur la case cliquée, puis donner le tour actuel au bon joueur, vérifier s'il reste des coups à jouer et appeler <strong>checkWinner()</strong> pour vérifier si la partie est gagnée après le coup.</p>
        <iframe title="main"
        width="100%"
        height="350"
        src="data:text/html;charset=utf-8,
        <head><base target='_blank' /></head>
        <body><script src='https://gist.github.com/laamphan/56fc22148582d23cba8447edacfb8d80.js'></script>
        </body>"/>
        <p>Presque là. Voici <strong>checkWinner()</strong> la partie la plus importante de notre jeu, la validation du gagnant. Nous le publierons si le jeu est gagné.</p>
        <iframe title="main"
        width="100%"
        height="350"
        src="data:text/html;charset=utf-8,
        <head><base target='_blank' /></head>
        <body><script src='https://gist.github.com/laamphan/f37c737705713e8b40c90f05a8bc0d62.js'></script>
        </body>"/>
        <p>Et enfin, réinitialisez le jeu avec <strong>restart()</strong> s'il s'est terminé par un match nul ou si nous avons trouvé un gagnant !</p>
        <iframe title="main"
        width="100%"
        height="180"
        src="data:text/html;charset=utf-8,
        <head><base target='_blank' /></head>
        <body><script src='https://gist.github.com/laamphan/14ff189164cfc935dd2439c6d9d37a70.js'></script>
        </body>"/>
        <p>En gros, c'est ça ! <br>
        Vous avez un jeu de Tic Tac Toe jouable fonctionnel ;)</p>
        <div id="codesandbox">
        <iframe src="https://codesandbox.io/embed/tictactoe-6kx5mh?fontsize=12&hidenavigation=1&module=%2FApp.svelte&theme=dark&view=split&hidedevtools=1"
        style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
        title="TicTacToe"
        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
      ></iframe>
        </div>

     </div>
  </section>
</main>
<style>
  section {
  display: flex;
  width: 75vw;
  margin-top: 5vh;
  margin-left: 14vw;
  }
  h3{
    padding-top: 60px;
  }
  .customer-grid{
   display: flex;
   flex-wrap: wrap;
   flex-direction: row;
   align-items:center;   
   }
   .customer-grid > div {
   display: flex;    
   flex-basis: calc(50% - 40px);  
   justify-content: center;
   flex-direction: column;
   }
   .customer-grid > div > img {
   display: flex;
   flex-direction: row;
   filter: drop-shadow(0 0 0.3rem rgb(0, 0, 0));
   }
   .customer {
      margin: 20px;
   }


</style>
