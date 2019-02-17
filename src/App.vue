<template>
  <div class="root flex-wrap">
    <nav class="text-center flex-wrap">
      <img :src="icon" alt="Icon Ingat Sholat" class="icon">
      INGAT SHOLAT
    </nav>
    <p v-if="loading===true" class="flex-wrap text-center loading">Loading...</p>
    <p v-else-if="loading!==true && loading !==false" class="flex-wrap text-center loading">
      {{errorMsg}}.
      <template v-if="loading!=='denied'">Refreshing {{counter}}...</template>
    </p>
    <template v-else>
      <div class="header">
        <p class="label">Lokasi</p>
        <p class="konten lokasi">{{data.query}}</p>
      </div>
      <div class="header">
        <p class="label">Tanggal</p>
        <p class="konten">{{data.items[0].date_for | time}}</p>
      </div>
      <p class="jadwal text-center">JADWAL SHOLAT HARI INI</p>
      <div class="row text-center">
        <div
          class="col-md-6"
          v-for="(list,key,idx) in prayer"
          :key="list['date-for']"
          v-if="idx!==0"
        >
          <p class="label">{{key}}</p>
          <p class="konten time">{{list}}</p>
        </div>
      </div>
    </template>
    <div class="spacer"></div>
    <button v-if="supported" class="btn" @click="register">Tampilkan Notifikasi</button>
  </div>
</template>

<script>
/* eslint-disable */
import axios from 'axios'
import moment from 'moment'
import icon from './assets/icon.png'

export default {
  data() {
    return {
      data: null,
      navigatorReady: false,
      allow: false,
      loading: true,
      counter: 5,
      icon,
      city: null
    }
  },
  computed: {
    supported() {
      return (
        'serviceWorker' in navigator &&
        'Notification' in window &&
        this.navigatorReady &&
        Notification.permission === 'default'
      )
    },
    prayer() {
      if (!this.data) return null
      let obj = {}
      const waktu = [
        'date',
        'shubuh',
        'shuruq',
        'dzuhur',
        'ashar',
        'maghrib',
        'isya'
      ]
      Object.keys(this.data.items[0]).forEach((el, idx) => {
        obj[waktu[idx]] = this.data.items[0][el]
      })
      return obj
    }
  },
  methods: {
    async register() {
      const ready = await navigator.serviceWorker.ready
      let pushReg = await ready.pushManager.subscribe({
        userVisibleOnly: true
      })
      pushReg = pushReg.toJSON()
      const data = {}
      console.log('PUSH REGISTRATION', pushReg)
      console.log('P256DH', (data.p256dh = pushReg.keys.p256dh))
      console.log('auth', (data.auth = pushReg.keys.auth))
      data.endpoint = pushReg.endpoint
      data.location = this.city
      axios
        .post(
          'https://ingat-sholat.herokuapp.com/store',
          {
            ...this.prayer,
            ...data
          },
          {
            headers: {
              Authorization: 'Bearer hello-prayer-app'
            }
          }
        )
        .then(res => {
          console.log(res)
          this.navigatorReady = false
          alert('Berhasil mengaktifkan push notifikasi!')
        })
        .catch(res => console.log(res))
    },
    displayLocation(latitude, longitude) {
      axios
        .get(
          'https://maps.googleapis.com/maps/api/geocode/json?latlng=' +
            latitude +
            ',' +
            longitude +
            '&sensor=true'
        )
        .then(async res => {
          let found = true
          let city = res.data.results[0].address_components.find(el =>
            /(?:kabupaten|kota)/gi.test(el.long_name)
          ).long_name
          console.log(city)
          if (city) {
            this.city = city = city
              .replace(/(?:kabupaten|kota)/gi, '')
              .trim()
              .toLowerCase()
          } else {
            found = false
            city = 'jakarta'
          }
          this.getTime(city)
        })
        .catch(err => {
          console.log(err)
          setTimeout(() => {
            location.reload()
          }, 3000)
        })
    },
    getLongLang() {
      const vm = this
      var successCallback = function(position) {
        var x = position.coords.latitude
        var y = position.coords.longitude
        vm.allow = true
        vm.displayLocation(x, y)
      }
      var errorCallback = function(error) {
        switch (error.code) {
          case 1:
            vm.errorMsg = 'Permission denied'
            vm.loading = 'denied'
            break
          case 2:
            vm.errorMsg = 'Position unavailable'
            break
          case 3:
            vm.errorMsg = 'Timeout'
            break
          default:
            vm.errorMsg = 'Unknown error'
            vm.loading = 'timeout'
        }
        if (error.code > 1) {
          vm.loading = 'timeout'
          vm.startCounting()
        }
      }

      var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }

      navigator.geolocation.getCurrentPosition(
        successCallback,
        errorCallback,
        options
      )
    },
    getTime(city) {
      console.log('TRIGGERRED')
      axios
        .post('https://ingat-sholat.herokuapp.com/', { city })
        .then(res => {
          console.log(res.data)
          this.data = res.data
          this.loading = false
        })
        .catch(res => {
          console.log(res)
          this.errorMsg = res
          this.loading = 'error'
        })
    },
    startCounting() {
      setInterval(() => {
        this.counter--
      }, 1000)
      setTimeout(() => {
        location.reload()
      }, 5000)
    }
  },
  created() {
    this.getLongLang()
  },
  filters: {
    time(val) {
      return moment(val, 'YYYY-MM-DD').format('DD MMM YYYY')
    }
  },
  watch: {
    data(val) {
      if (val) {
        navigator.serviceWorker.ready.then(reg => {
          this.navigatorReady = true
          if (reg.active.state === 'activated') {
            if (window.Notification.permission === 'granted') this.register()
          } else {
            reg.active.onstatechange = () => {
              if (reg.active.state === 'activated') {
                if (window.Notification.permission === 'granted')
                  this.register()
              }
            }
          }
        })
      }
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: Arial, Helvetica, sans-serif;
  color: #333;
}
body {
  background-color: ghostwhite;
}
.label {
  color: #999;
  font-weight: 800;
}
.flex-wrap {
  display: flex;
}
.btn {
  padding: 15px;
  margin: 0 -15px;
  border: none;
  background-color: #4caf50;
  color: white;
  font-size: 16px;
}
.root {
  margin: 0 auto;
  padding: 0 15px;
  flex-flow: column wrap;
  min-height: 100vh;
  max-width: 100%;
  width: 500px;
  background-color: #e8f5e9;
}
.loading {
  height: 100%;
  justify-content: center;
  align-items: center;
}
.text-center {
  text-align: center;
}
.label,
.time {
  text-transform: uppercase;
}
.row {
  display: flex;
  width: 100%;
  flex-flow: row wrap;
}
.col-md-6 {
  width: 50%;
}
.text-right {
  text-align: right;
}
.left,
.right {
  flex-grow: 1;
}
.spacer {
  flex: 1;
}
.jadwal {
  letter-spacing: 4px;
  margin: 20px 0;
  font-size: 18px;
}
.time {
  font-size: 22px;
}
.lokasi {
  text-transform: capitalize;
}
nav {
  padding: 15px;
  border-bottom: 2px solid #4caf50;
  text-transform: uppercase;
  color: #4caf50;
  font-weight: 900;
  font-size: 24px;
  margin: 0 -15px;
  margin-bottom: 20px;
  align-items: center;
  justify-content: center;
}
nav .icon {
  width: 30px;
  margin-right: 10px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
[class^='col-md'] {
  margin-bottom: 10px;
}
</style>
