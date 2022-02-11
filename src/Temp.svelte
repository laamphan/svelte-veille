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
      width="2%"
      alt="logo"
    />
    <Nav class="ms-auto mb-2 mb-lg-0">
      <NavItem class="nav-item active">
        <NavLink href="">Home</NavLink>
      </NavItem>
      <NavItem class="nav-item active">
        <NavLink href="">Home</NavLink>
      </NavItem>
    </Nav>
  </Navbar>

  <header class="bg-dark py-5">
    <div class="container px-4">
      <div class="row gx-5 align-items-center justify-content-center">
        <div class="col-lg-8 col-xl-7 col-xxl-6">
          <div class="my-5 text-center text-xl-start">
            <h1 class="display-1 fw-bold pt-5 text-white mb-4 font-monospace">
              SVELTE
            </h1>
            <p class="lead fw-normal text-light mb-5 font-monospace">
              CYBERNETICALLY ENHANCED WEB APPS
            </p>
            <div
              class="d-grid gap-3 d-sm-flex justify-content-sm-center justify-content-xl-start"
            >
              <a
                class="btn btn-secondary btn-lg text-white px-4 me-sm-3"
                href="#someref">Discover</a
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
      <div class="flex-item">
        <h1>
          Svelte is a radical new approach to building user interfaces. Whereas
          traditional frameworks like React and Vue do the bulk of their work in
          the <em>browser</em>, Svelte shifts that work into a
          <em>compile step</em> that happens when you build your app.
        </h1>
        <h2>
          Instead of using techniques like virtual DOM diffing, Svelte writes
          code that surgically updates the DOM when the state of your app
          changes.
        </h2>
        <h3>
          We're proud that Svelte was recently voted the <a
            href="https://insights.stackoverflow.com/survey/2021#section-most-loved-dreaded-and-wanted-web-frameworks"
            >most loved web framework</a
          >
          with the
          <a
            href="https://2020.stateofjs.com/en-US/technologies/front-end-frameworks/"
            >most satisfied developers</a
          >
          in a pair of industry surveys. We think you'll love it too.
          <a href="/blog/svelte-3-rethinking-reactivity" class="cta"
            >Read the introductory blog post</a
          > to learn more.
        </h3>
      </div>
      <div class="flex-item code">
        <div id="code-box">
          <pre>
        <code>
          npx degit <a
                href="https://github.com/sveltejs/template"
                style="user-select: initial;">sveltejs/template</a
              > my-svelte-project
          cd my-svelte-project
          npm install
          npm run dev
        </code>
      </pre>
        </div>
        <p>
          See the <a href="/blog/the-easiest-way-to-get-started"
            >quickstart guide</a
          > for TypeScript support and more details.
        </p>
      </div>
    </div>
  </section>
</main>

<style>
  section {
    display: flex;
    justify-content: center;
    width: 75vw;
    margin-top: 5vh;
    margin-left: 14vw;
  }
  .flex-item:nth-of-type(1) {
    flex: 1 0;
  }
  .flex-item:nth-of-type(2) {
    flex: 1 0;
  }
  .code {
    padding: 2em;
  }
</style>
