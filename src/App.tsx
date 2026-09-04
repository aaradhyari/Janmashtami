import { useEffect, useState } from 'react';
import { EventProvider } from './lib/store';
import AdminDashboard from './pages/AdminDashboard';
import DisplayScreen from './pages/DisplayScreen';
import Home from './pages/Home';
import SetupPanel from './pages/SetupPanel';

type Route = 'home' | 'display' | 'admin' | 'setup';

function resolveRoute(): Route {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/display') return 'display';
  if (path === '/admin') return 'admin';
  if (path === '/setup') return 'setup';
  // hash fallback for static-file hosting (dist opened directly)
  const hash = window.location.hash.replace(/^#/, '');
  if (hash === '/display') return 'display';
  if (hash === '/admin') return 'admin';
  if (hash === '/setup') return 'setup';
  return 'home';
}

export default function App() {
  const [route, setRoute] = useState<Route>(resolveRoute);

  useEffect(() => {
    const onPop = () => setRoute(resolveRoute());
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
    };
  }, []);

  return (
    <EventProvider>
      {route === 'display' && <DisplayScreen />}
      {route === 'admin' && <AdminDashboard />}
      {route === 'setup' && <SetupPanel />}
      {route === 'home' && <Home />}
    </EventProvider>
  );
}
