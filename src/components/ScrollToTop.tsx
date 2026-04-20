import { useEffect } from 'react';

interface Props {
  view: string;
}

export default function ScrollToTop({ view }: Props) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  return null;
}
