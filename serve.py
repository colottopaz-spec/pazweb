"""Servidor local para desarrollo: igual que `python -m http.server`, pero le
indica al navegador que no guarde copias viejas (así cada recarga muestra los
últimos cambios de HTML, CSS y JS).

Uso:  python serve.py        → http://localhost:5173
      python serve.py 8080   → otro puerto
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    print(f'Sirviendo en http://localhost:{port}  (Ctrl+C para cortar)')
    ThreadingHTTPServer(('', port), NoCacheHandler).serve_forever()
