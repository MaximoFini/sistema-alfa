import * as React from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    // matchMedia: detecta cambios de breakpoint en uso normal
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener('change', checkMobile)

    // resize: detecta cambios en DevTools device mode (no siempre dispara matchMedia)
    window.addEventListener('resize', checkMobile)

    // Valor inicial
    checkMobile()

    return () => {
      mql.removeEventListener('change', checkMobile)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  return !!isMobile
}
