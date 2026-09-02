import { AlertItem, BottleneckItem, CameraFeed, DetectionLog, DispatchUnit, TrackedTarget, WatchlistItem } from '../types';

export const ASSETS = {
  operatorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ-dRzewIOrUOh_-EXMLl7AxnLPDMGxwbmIBpvcRg4Sxe3SDzVBwDY2QqYU6f6UytKMYDd_x1-Z3FDoUvHqC6paXqUKQB4T331h6W-FoGcbIMIK_T_3dwEPlxZjluDNznQJ56c10Q9aK89ZcA_-mTNfswdOsweSBRL96Iks4UhjVi_JuUmzNzZG63FhTCf7vn-49FxiBXiHOjW-VdEuuIlWEIszjlOAxianXgbLw_s83vC1FKOje-G',
  cam01Highway: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANBGHf9DTFRkkCiYrVL029R4eCl_ooqnZeoI3RpM2rsTeuErbY14mTTBDZGVB3UQ5y9zdreyXpnmS_W3TKaoDsq2DwB3b0hZC9PbkDBOXdj_WJr3gA5pml-b7p25Nj_MnlSJXjaR2xO7D4GxqSjY-ig82f8UpRCje_0I2pPpLAb2C_XobOz43JOHqpQTsSNQc1Yo-tjl9RqbjI0NFbgI6fevbEQRqJL8qC3z39jvGlBhPYl7rWie0S',
  cam04Thermal: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0Fsc5eFMQFedNlHRrsYEE-GTnTPTaVsYXyXXLB12lCYwV-f24GYALBPa_dpA-dOjrFAIsJVRPTLK3XQlxJ3VDMZRSpatCSo1_qd3MDcN9DNg6agnBjRS4gxDZ5YarH1K9eVNYhOmsyY0wPEDa-FK3P_EJSLoszI-08FufZxHnX4ZBb-RlOYT-Ckx6XfSlmLhYJ4TyWtqLCtGqqzsHp4sURzA5Dk_4RKdKmFjywvcTcDoocmdgOh7a',
  cam12Toll: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1IXeJeFGsPX29Ad9lJZnLjeVu0FjEnfti8VHElOKW8SFeCb350zuYI4PBpEhX7qUPEK_stWisnkrIqgkLlooSsqeI_ib9s1IzNYY1ycWLv46Eyu4BuqLAZks9Hy3bglBNvDfjDGosSK479-8zvJwvSnJUMwpIkig438LknumJHOXHDIcx5Wmi_sf5qCUq0S1mjr0blGpzXcxZrFj_2VzQyI8TWUJBRbLRVkFzXeaqOEfTCuaSLYkf',
  trajectoryMapBg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDf_u3TcsTGhXDR85kpqmHS_KoVwHPspMlU9IxjGvmcWCpZznpJ0X1DUgyKfH9rBCOmaVV65rMGBZzj3WTeZyU48zKTM6y9hCChsktNW9gM1N9U1ncOk31pa7XrvN64VIn5c69MmNsxUQTnyVsCg_Cl68KSBEro_sdVzBsLqGMnxx3lyA0c1QVMNr-ztjv9sZ0abPzkq1y5Zo_9mhSmDDLazQzmAgicjM6ihvwbGCas1x80ZXOfx9h5',
  analyticsMapBg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9OXFxO210yXjco7pyhgLxyGxGkWBQYobXnkpeNlvqiE3UjFmNGSL86olec2CQ-KWhlnU3m4BN8yaUZdGtbpsZ2Hk9NBfUiu-03_YSIqoDsWHRyH42I_ydpcj5y4BjzbjonXo5PsYEp1WPR26Hkw1C33TWKwV4obIRpozxKjjByMekKvgMVN6nksMpthYFO4-xrg6sh-RzZBqhwPli04CwUJVWamP4v5H5p3JZTB7inTpaPaRrAMog',
  alertSedanSnapshot: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEuNNIlqvatm9dc3cStnM-5G_wY1A3KBnJx3pV477yF22D0VtHZ0K7Yzdp497O61ZR0zjDRGNwYGKk_-XBbSHHXcEhfeaO5aiP0oSKs807jKG9XIt9EPW3WYOR7W__kMOsrYikyJaJVbVRE-vB7_MpiLK7Z8fuYPKd6tXoArGgQ08Nfa3bLN2JrNSbfmYDkhDZjDRhrbw7wN7LOF_GVQNmIXvFwFd_oclCZRFEs3bIXEV-n2k_2jlb',
  alertMinimap1: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbfzocUnT18QpwzRTkcStl7Vt3ZlWspEZ8ppC5oPo8gCz3inTTVgHP7DNS6w7YlGXYVnkNJ3GsLRU7LXgIk_DehXx-Lvwr-WnkudG96BkyzehkFQZcdjiCA9OoyEbIpxOv0QtT4rf7b5_hwr97vv65Ma2JHYvhgnPlIeo1xLit3wAykQ3KX6c1X5nh-A7AvFD_6Y8kbGgN9c_MVQTBUZWsaWZ2hB9aEasz43TZw80erXFr6x22msx4',
  alertSuvSnapshot: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADH3vTUai41UXDdlib5Q6Sv_DMJueQAEQB_rdEvhMs55_B7Mof1104c7ADV-oKkkHcmLrPrRDnb-ITSmYA7D9PZJSekeeeOVvJJSQunfl5olHlplvv62yO6ePMJ20w3ntZ9pDeNmqaVjwh9Iu8ey0HmlWfd0UsGqxoreXGwM4TZ6rrLFlJnAwd-RgWSADiasZZwxM_O-SXg6bLRxR8C9ni_cQfDVTvGdxSVVzSRqSmsxzLZ8IR2RFH',
  alertMinimap2: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOak7tmjP2pYq_FTMl01XGNqTmMC-a0jL05NikgBhQd7nHJvEHoFChjhcYd8gkbCunwl4h0YfniPgyz9-DYINtkmt79cLwQs8XHty8waoiWkM_W-Nm5YtXuz9ZJPmLW_hIrhdNenO5vCMCITFw5qy-DBniucFzSyTgQZ7DQ0LxeRjKKS-jo30PpON-41jVH4_FE74Z0hBUTYzCbergqL3jn-HAZqRErjMZEN7a4QxA2jA4W7XQYlNJ',
  systemLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDD3LpxcsRQGPuUZXZUPN_RdS5ei8Z7VruxjFl-n3Z-egnTdAOx3-BVWuOUc224sa7s-yTr0Cy_5DpJzoIMarfknLavnLruIlYn4xWWtagnaxdVw9xV9PWJ56-5flAESeSmP2rbxLvSnuHO5iaCBbuEpPtHNJtcfEiqTth486UnY_ulOkcayghr6IzrVfbL05i7zAacEvKnlv4lTPAjXhdV2WZTD8TtfvwRAHOwoUbpp9O8mebeCZfn'
};

export const INITIAL_CAMERA_FEEDS: CameraFeed[] = [
  {
    id: 'cam-01',
    name: 'CAM-01-N',
    location: 'I-89 (HIGHWAY INT.)',
    streamType: 'rgb',
    status: 'live',
    fps: 30,
    resolution: '1920x1080',
    bgImage: ASSETS.cam01Highway,
    speedAvg: 48,
    trafficFlow: 'MODERATE (48 MPH)',
    incidents: 0,
    detections: [
      {
        id: 'box-1',
        label: 'ID: 8942 · 99%',
        confidence: 99.1,
        top: '45%',
        left: '30%',
        width: '15%',
        height: '25%',
      },
      {
        id: 'box-2',
        label: 'HIT: STOLEN',
        confidence: 98.4,
        isAlert: true,
        alertText: 'HIT: STOLEN',
        top: '55%',
        left: '60%',
        width: '12%',
        height: '20%',
      }
    ]
  },
  {
    id: 'cam-04',
    name: 'CAM-04-E (IR)',
    location: 'MAIN AVE & 43RD UTC',
    streamType: 'ir',
    status: 'live',
    fps: 24,
    resolution: '1280x720',
    bgImage: ASSETS.cam04Thermal,
    speedAvg: 28,
    trafficFlow: 'LIGHT (28 MPH)',
    incidents: 0,
    detections: [
      {
        id: 'box-3',
        label: 'ID: 4409 · 96%',
        confidence: 96.3,
        top: '40%',
        left: '52%',
        width: '14%',
        height: '18%',
      }
    ]
  },
  {
    id: 'cam-12',
    name: 'CAM-12-TOLL',
    location: 'BAY BRIDGE TOLL PLAZA',
    streamType: 'toll',
    status: 'live',
    fps: 60,
    resolution: '3840x2160',
    bgImage: ASSETS.cam12Toll,
    speedAvg: 15,
    trafficFlow: 'SLOW (15 MPH)',
    incidents: 0,
    detections: [
      {
        id: 'box-4',
        label: 'ID: 1102 · 95%',
        confidence: 95.0,
        top: '60%',
        left: '45%',
        width: '18%',
        height: '30%',
      }
    ]
  },
  {
    id: 'cam-08',
    name: 'CAM-08-W',
    location: 'WEST ARTERY CONNECTOR',
    streamType: 'offline',
    status: 'reconnecting',
    fps: 0,
    resolution: 'N/A',
    speedAvg: 0,
    trafficFlow: 'UNKNOWN',
    incidents: 1,
    detections: []
  }
];

export const INITIAL_DETECTION_LOGS: DetectionLog[] = [
  {
    id: 'det-1',
    plate: 'HMB-9959',
    timestamp: '23:00:44.613',
    camera: 'CAM-12-TOLL',
    sector: 'Sector 12',
    confidence: 94.0,
    isAlert: false,
    vehicleClass: 'Sedan',
    speedMph: 22,
    direction: 'Northbound'
  },
  {
    id: 'det-2',
    plate: 'XYZ-9921',
    timestamp: '14:23:41.002',
    camera: 'CAM-01-N',
    sector: 'Sector 7G',
    confidence: 99.1,
    isAlert: true,
    alertType: 'HOTLIST',
    watchlistName: 'Watchlist A',
    vehicleClass: 'Sedan (Black)',
    speedMph: 64,
    direction: 'Eastbound'
  },
  {
    id: 'det-3',
    plate: 'ABC-1234',
    timestamp: '14:23:40.812',
    camera: 'CAM-12-TOLL',
    sector: 'Sector 12',
    confidence: 98.4,
    isAlert: false,
    vehicleClass: 'SUV (Silver)',
    speedMph: 18,
    direction: 'Northbound'
  },
  {
    id: 'det-4',
    plate: 'LMN-5678',
    timestamp: '14:23:39.115',
    camera: 'CAM-04-E',
    sector: 'Sector 4',
    confidence: 95.2,
    isAlert: false,
    vehicleClass: 'Compact',
    speedMph: 31,
    direction: 'Eastbound'
  },
  {
    id: 'det-5',
    plate: 'UNK-####',
    timestamp: '14:23:38.001',
    camera: 'CAM-01-N',
    sector: 'Sector 1',
    confidence: 62.1,
    isAlert: false,
    vehicleClass: 'Unknown',
    speedMph: 52,
    direction: 'Westbound'
  },
  {
    id: 'det-6',
    plate: 'QWE-8822',
    timestamp: '14:23:35.442',
    camera: 'CAM-12-TOLL',
    sector: 'Sector 12',
    confidence: 97.8,
    isAlert: false,
    vehicleClass: 'Truck',
    speedMph: 14,
    direction: 'Northbound'
  },
  {
    id: 'det-7',
    plate: 'NY-7B329A',
    timestamp: '14:22:15.890',
    camera: 'CAM-108',
    sector: 'Sector 2',
    confidence: 98.8,
    isAlert: true,
    alertType: 'TRACKING TARGET',
    watchlistName: 'Priority 1',
    vehicleClass: 'SUV',
    speedMph: 34,
    direction: 'Northbound'
  }
];

export const INITIAL_TRACKED_TARGETS: Record<string, TrackedTarget> = {
  'NY-7B329A': {
    plate: 'NY-7B329A',
    status: 'TRACKING',
    totalDistance: '14.2 mi',
    avgSpeed: '34 mph',
    lastSeenLocation: 'Sector 7 - Lower Manhattan',
    vehicleModel: '2023 Grand Cherokee (Grey)',
    color: '#8A929A',
    alerts: ['Flagged Surveillance Target', 'Unregistered Crossing'],
    history: [
      {
        id: 'tp-1',
        timestamp: '14:22:15',
        cameraName: 'Camera #108 (Sector 2)',
        sector: 'Sector 2 - Canal St',
        direction: 'Northbound',
        lat: 40.7128,
        lng: -74.0060,
        speedMph: 36,
        conf: 99.2,
        isLatest: true
      },
      {
        id: 'tp-2',
        timestamp: '14:20:05',
        cameraName: 'Camera #42 (Sector 4)',
        sector: 'Sector 4 - Holland Tunnel Approach',
        direction: 'Northbound',
        lat: 40.7258,
        lng: -74.0130,
        speedMph: 34,
        conf: 98.4
      },
      {
        id: 'tp-3',
        timestamp: '14:15:33',
        cameraName: 'Camera #27 (Sector 4)',
        sector: 'Sector 4 - West Side Hwy',
        direction: 'Eastbound',
        lat: 40.7090,
        lng: -74.0180,
        speedMph: 31,
        conf: 97.9
      },
      {
        id: 'tp-4',
        timestamp: '14:08:12',
        cameraName: 'Camera #15 (Sector 8)',
        sector: 'Sector 8 - Battery Tunnel Exit',
        direction: 'Northbound',
        lat: 40.7015,
        lng: -74.0145,
        speedMph: 28,
        conf: 96.5
      }
    ]
  },
  'XYZ-8902': {
    plate: 'XYZ-8902',
    status: 'TRACKING',
    totalDistance: '8.7 mi',
    avgSpeed: '52 mph',
    lastSeenLocation: 'Sector 7G - I-95 North Interchange',
    vehicleModel: '2021 Dark Sedan (Black)',
    color: '#1e293b',
    alerts: ['STOLEN VEHICLE ALERT', 'HIGHWAY PURSUIT POTENTIAL'],
    history: [
      {
        id: 'tp-101',
        timestamp: '14:21:45',
        cameraName: 'Camera #89 (Sector 7G)',
        sector: 'Sector 7G - I-95 North',
        direction: 'Northbound',
        lat: 40.7484,
        lng: -73.9857,
        speedMph: 64,
        conf: 98.6,
        isLatest: true
      },
      {
        id: 'tp-102',
        timestamp: '14:12:30',
        cameraName: 'Camera #64 (Sector 6)',
        sector: 'Sector 6 - Midtown Artery',
        direction: 'Northbound',
        lat: 40.7350,
        lng: -73.9920,
        speedMph: 55,
        conf: 97.2
      }
    ]
  },
  'ABC-1234': {
    plate: 'ABC-1234',
    status: 'TRACKING',
    totalDistance: '21.5 mi',
    avgSpeed: '41 mph',
    lastSeenLocation: 'Sector 3 - North Corridor Overpass',
    vehicleModel: '2022 Silver SUV',
    color: '#CBD5E1',
    alerts: ['SUSPICIOUS ROUTE', 'POI SURVEILLANCE'],
    history: [
      {
        id: 'tp-201',
        timestamp: '13:05:12',
        cameraName: 'Camera #33 (North Corridor)',
        sector: 'North Corridor Overpass',
        direction: 'Eastbound',
        lat: 40.7614,
        lng: -73.9776,
        speedMph: 45,
        conf: 96.8,
        isLatest: true
      }
    ]
  }
};

export const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'alert-1',
    title: 'Stolen Vehicle',
    type: 'stolen',
    plate: 'XYZ-8902',
    timestamp: '14:21:45',
    sector: 'SECTOR 7G',
    confidence: 98.0,
    snapshotUrl: ASSETS.alertSedanSnapshot,
    minimapUrl: ASSETS.alertMinimap1,
    status: 'active',
    lat: 40.7484,
    lng: -73.9857,
    notes: 'Reported stolen 45 mins ago from Queens terminal. Armed driver warning.'
  },
  {
    id: 'alert-2',
    title: 'Suspicious Route',
    type: 'suspicious',
    plate: 'ABC-1234',
    timestamp: '13:05:12',
    sector: 'NORTH CORRIDOR',
    confidence: 94.5,
    snapshotUrl: ASSETS.alertSuvSnapshot,
    minimapUrl: ASSETS.alertMinimap2,
    status: 'active',
    lat: 40.7614,
    lng: -73.9776,
    notes: 'Abrupt lane maneuvers across 3 lanes near structural overpass.'
  },
  {
    id: 'alert-3',
    title: 'Hotlist ANPR Match',
    type: 'hotlist',
    plate: 'XYZ-9921',
    timestamp: '14:23:41',
    sector: 'SECTOR 1 - HIGHWAY INT.',
    confidence: 99.1,
    snapshotUrl: ASSETS.cam01Highway,
    minimapUrl: ASSETS.alertMinimap1,
    status: 'active',
    lat: 40.7128,
    lng: -74.0060,
    notes: 'Watchlist A flag: License suspension + outstanding warrant.'
  }
];

export const INITIAL_WATCHLIST: WatchlistItem[] = [
  {
    id: 'wl-1',
    plate: 'XYZ-8902',
    category: 'STOLEN',
    addedAt: '08:00 AM',
    priority: 'high',
    notes: 'Grand theft auto reported precinct 14'
  },
  {
    id: 'wl-2',
    plate: 'ABC-1234',
    category: 'POI - SURVEILLANCE',
    addedAt: 'Yesterday',
    priority: 'medium',
    notes: 'Undercover surveillance operation'
  },
  {
    id: 'wl-3',
    plate: 'LMN-9988',
    category: 'EXPIRED REG',
    addedAt: '2w ago',
    priority: 'low',
    notes: 'Vehicle registration expired > 90 days'
  }
];

export const INITIAL_BOTTLENECKS: BottleneckItem[] = [
  {
    id: 'bn-1',
    location: 'Sector 7G / I-95 North',
    flowRate: 12,
    severity: 'Critical',
    trend: 'decreasing',
    actionLabel: 'Deploy'
  },
  {
    id: 'bn-2',
    location: 'Downtown Ring Road',
    flowRate: 45,
    severity: 'Moderate',
    trend: 'stable',
    actionLabel: 'View'
  },
  {
    id: 'bn-3',
    location: 'Bridge 4 Approach',
    flowRate: 51,
    severity: 'Moderate',
    trend: 'stable',
    actionLabel: 'View'
  }
];

export const AVAILABLE_DISPATCH_UNITS: DispatchUnit[] = [
  {
    id: 'unit-1',
    name: 'Patrol Unit 04',
    type: 'Patrol Car',
    status: 'Available',
    etaMinutes: 3,
    sector: 'Sector 7G'
  },
  {
    id: 'unit-2',
    name: 'Drone Team Alpha',
    type: 'Drone Unit',
    status: 'Available',
    etaMinutes: 1,
    sector: 'Sector 7 Central'
  },
  {
    id: 'unit-3',
    name: 'Interceptor Team 12',
    type: 'Interceptor',
    status: 'Available',
    etaMinutes: 5,
    sector: 'I-95 Northway'
  },
  {
    id: 'unit-4',
    name: 'Air Support Bravo (Helicopter)',
    type: 'Helicopter',
    status: 'Available',
    etaMinutes: 4,
    sector: 'Midtown Hub'
  }
];
