export default function () {
  if (navigator.serviceWorker) {
    self.addEventListener('load', () => {
      navigator.serviceWorker
        .register(location.href + 'service-worker.js')
        .then(reg => {
          console.log('SW REGISTRATION', reg)
          reg.onupdatefound = () => {
            const installing = reg.installing
            console.log('INSTALLING SW', installing)
            installing.onstatechange = () => {
              console.log(installing.state, navigator.serviceWorker.controller)
              if (
                navigator.serviceWorker.controller &&
                installing.state.toLowerCase() === 'installed'
              ) {
                console.log('update found', installing)
                location.reload()
              } else {
                console.log('file is cached')
              }
            }
          }
        })
        .catch(err => console.log('ERROR WHEN REGISTERING SW', err))
    })
  }
}
