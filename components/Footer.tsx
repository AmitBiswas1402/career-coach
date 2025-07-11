const Footer = () => {
  return (
    <footer className="bg-gradient-to-tr from-background via-muted to-background border-t border-border py-10 mt-10">
      <div className="max-w-6xl mx-auto px-4 text-center flex flex-col items-center justify-center space-y-3">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Your AI Career Coach. All rights reserved.
        </p>
        <p className="text-sm text-muted-foreground">
          Made with 💻 by{" "}
          <a
            href="https://github.com/AmitBiswas1402"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline underline-offset-4 transition-all duration-300"
          >
            Coder
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
