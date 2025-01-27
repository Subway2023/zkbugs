/**
 * @module @zk-kit/eddsa-poseidon
 * @version 1.0.3
 * @file A JavaScript EdDSA library for secure signing and verification using Poseidon the Baby Jubjub elliptic curve.
 * @copyright Ethereum Foundation 2024
 * @license MIT
 * @see [Github]{@link https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/eddsa-poseidon}
*/
import { subOrder, mulPointEscalar, Base8, inCurve, addPoint, Fr, packPoint, unpackPoint } from '@zk-kit/baby-jubjub';
import { requireBuffer, crypto } from '@zk-kit/utils';
import { bigNumberishToBigInt, bufferToBigInt, leBufferToBigInt, leBigIntToBuffer } from '@zk-kit/utils/conversions';
import { requireTypes, requireBigNumberish } from '@zk-kit/utils/error-handlers';
import F1Field from '@zk-kit/utils/f1-field';
import * as scalar from '@zk-kit/utils/scalar';
import { Buffer } from 'buffer';
import { isArray, isBigNumber, isObject, isBigNumberish } from '@zk-kit/utils/type-checks';

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var poseidon5$1 = {};

const F = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
const N_ROUNDS_F = 8;
const N_ROUNDS_P = [56, 57, 56, 60, 60, 63, 64, 63, 60, 66, 60, 65, 70, 60, 64, 68];
const pow5 = v => {
  let o = v * v;
  return v * o * o % F;
};
function mix(state, M) {
  const out = [];
  for (let x = 0; x < state.length; x++) {
    let o = 0n;
    for (let y = 0; y < state.length; y++) {
      o = o + M[x][y] * state[y];
    }
    out.push(o % F);
  }
  return out;
}
function poseidon(_inputs, opt) {
  const inputs = _inputs.map(i => BigInt(i));
  if (inputs.length <= 0) {
    throw new Error('poseidon-lite: Not enough inputs');
  }
  if (inputs.length > N_ROUNDS_P.length) {
    throw new Error('poseidon-lite: Too many inputs');
  }
  const t = inputs.length + 1;
  const nRoundsF = N_ROUNDS_F;
  const nRoundsP = N_ROUNDS_P[t - 2];
  const {
    C,
    M
  } = opt;
  if (M.length !== t) {
    throw new Error(`poseidon-lite: Incorrect M length, expected ${t} got ${M.length}`);
  }
  let state = [0n, ...inputs];
  for (let x = 0; x < nRoundsF + nRoundsP; x++) {
    for (let y = 0; y < state.length; y++) {
      state[y] = state[y] + C[x * t + y];
      if (x < nRoundsF / 2 || x >= nRoundsF / 2 + nRoundsP) state[y] = pow5(state[y]);else if (y === 0) state[y] = pow5(state[y]);
    }
    state = mix(state, M);
  }
  return state[0];
}
var poseidon_1 = poseidon;
getDefaultExportFromCjs(poseidon_1);

var unstringify = {};

Object.defineProperty(unstringify, "__esModule", {
  value: true
});
unstringify.default = unstringifyBigInts;
function unstringifyBigInts(o) {
  if (Array.isArray(o)) {
    return o.map(unstringifyBigInts);
  } else if (typeof o == 'object') {
    const res = {};
    for (const [key, val] of Object.entries(o)) {
      res[key] = unstringifyBigInts(val);
    }
    return res;
  }
  const byteArray = Uint8Array.from(atob(o), c => c.charCodeAt(0));
  const hex = [...byteArray].map(x => x.toString(16).padStart(2, '0')).join('');
  return BigInt(`0x${hex}`);
}

var _5 = {};

Object.defineProperty(_5, "__esModule", {
  value: true
});
_5.default = void 0;
var _default = {
  C: ['FEhhRZjgD5jnrn3qRfvYO9loZT74OQzeLoa3Bq1AxlE=', 'CreykTiOXJ5DwNwfWR+4Ps22UCLhtwr0O4p7QMHf98M=', 'K3y7IXiW9SyajAiOZUryHoTN51SjzvWxXE1UZmEtat8=', 'K8aw3b4dcBtlcEKL3Byhvw2ln/O7u5X8K8ccDG5nplw=', 'EjpVoxmAOE89ILLOy8RO1gw4wR99IOknHvq5qQXu/Tw=', 'A3UBzIydyBkwmnafTfCY5YiwGFi8jrfieeKIO+n7jFM=', 'HCEW5H4DqGuxFpWwpfbatrmkYLHrlRqwHCWeyj/UfVE=', 'LBghNIkDLoWpyMuOmmWDm/rtE+V7wPrknb2uv1T1b5M=', 'Luj+09TSxxoEKer9jl2xcY8p4iJ5hf3yrYcDyDW54DE=', 'KMZNj17XqsAEySAp2em/kbqUNtHM6UuTFtERxwoMFxQ=', 'GKAdn/t0euDePoPHB/iyT2gshPFav1cbNCVKA0eGZeA=', 'HCHZK+8ZfnOyNOR3e2DbFOZCpWzucVFdVOGscc3nK9M=', 'CtQEzLyx4ZWJfLYMgJgeu51mpmd9u+2ti2RV/mLYB7E=', 'Cptt6DMGT5O2rbma9sAFlFy2VMt70UyLl6+LYMwfs4c=', 'ExKeP5MK7W1HaQMx/wncUWDvpY3c4sPmGA1FvsOqOm8=', 'DXphTImRUIqxzkiVgTuxyC8Yv3v8nigMzKGAeYOTh/E=', 'BTL37DbjAEGwSGmGh1yROkm93y9a9f6+jDHy9AlP/qU=', 'BrvLjo4YAgEpPnEvSVDxsLvugIydZCY8hNnYrhVcuJI=', 'D1WKTbGjrAf2Hi5r7pR/c1hr9A8hHOtPaHylZ4qdyzM=', 'K+FApgtbXy+O3XioGKlpsgxkPkGbzwtXfCSg0Oes/pg=', 'HEnEuanwn3ua1fdOusxxBRK46Ge6zifLDeoG6JuW9jE=', 'FwwacychsSzefzPkdqOaGqd6gcBuLqxQOEewDVl2Uts=', 'GcJ9DlL2XKNPTjGgaOSTMca/w52SQfnUwwIEFhXPJ/E=', 'LxvcUlT5Igwacx/FJ2lk2rJrOF+kC2sEvtmWDiVDugg=', 'BbQtL7zL9NOdK+kznKvp0Nxtkh6FXNkRVLY50o1KHPA=', 'EiAEBxWkGtWfT0EODAWkLF/TKsUv6dBviBiNcfYeCTU=', 'JflSZSYVW4OUZgn3u5UH3Ukl74cd7pFtkUTrtOzhNDw=', 'AXv+QoQpmud0C20OIElR4xSopdBFJBkUeXipWzR0JEQ=', 'Kl1HZAIcpx14qWdMtnCPFYjSzq81eMQRHPizWe7wic8=', 'F/Atq3RfvjwIEyH+XO+EXnuNBwslFNKbKnt9icwIFdo=', 'GdpiYm23GZtl9K3PV/pKPbqhdkp70VVwjubzeMie8BM=', 'D4jilfou2BtCbJH6aTZqc+33Xzm/GGNM0mbsQDiCngU=', 'H+McVUhUbHlI/k7hvXQS4ygO/30gywmqhfSfJ2YUgBc=', 'EP3BYTvb9n84vd5WGy+R5MxItZ+Y1kNjj9wK+tv+Em4=', 'HyYYwuvpV0UIucUvAADjPr/drRoD/da8pu9/AJMSe+8=', 'Ep/n/D76xqirI9um2IbzlNoR9ZU8+Y4oJpoNuip0XdM=', 'Fa/UzfHk+CDBYx1KuFykujuvz+5yvq3p+uYFIxAkSOM=', 'Hyx0ulw2fjcNco5x4VsmiFGnu4tFUoy3NJVgeayZsBI=', 'ETDhhy128vk2nPWble35zhnwH6icnDaybgne9nhtrTw=', 'E1I9Fz9+a623O2P8HJu9vuJCxhvGhlZJMydTOlwbHco=', 'FNpA0K9CemXxhBta3JZThlM2j3JUy1Zn3a27rXpXTNQ=', 'AJH5ZADkKX6oW7GGwXswToJjjlf9Yx/2MVl24aXdi4Y=', 'MDMpv5AxxVFbmjTUmmS7agJnvHtUoN7KXEUCd6ACzcs=', 'FO1H5VwdocLwXTwaGy5sGFCfyDNuz+nbc3kW4oP6ghs=', 'EWHxCzV3ddgQrVO8xKINWt0rAyUcdH3rBO6UxWXljWs=', 'F6ilCucs5wfyK8Bw65koUcqRTrlMxo6vu4qWpxTrgiE=', 'Gmxh15Xbr2L5klCzfsXfiGRaHBU3kdtjErky3CUOT2I=', 'H4vSq4qoQGZMTu4ZjEaE3EsFdyuyoIadpnIrFfRHoTM=', 'H/y4UqTwAnqXmfExzXS5jM+4y8BjSdj+/MYvEMj7Pi8=', 'A150LsUvGbNtSJxyD0Z/+td81TvC213dskayMCH3nxg=', 'Hfqu5BvflNeDqin8Yrfse1VnOqgY0wX9QtF1oF8uPYY=', 'KCE3hHegLplQBaVjUIhUCUW9Mz8tFFXwOKIZuMR5azo=', 'HbSk0PI4pXCxBhxu7IHALzH/3Up8GedjF08jjQSJdCE=', 'FL94iUV7ILehNns0o6U4IX1pO1JCav9ApLtyiTsXhMo=', 'LO1Swr8pb4fldBDD7JqUg6eW0WT2BJEnEJ/w06nAhGU=', 'Hd6sWAWn9K2k0EQe0QjjFJ1M5lhPSa5b39RtZ2buozQ=', 'Lja05enJe0YjBOjitfnciOHJ8hYboEBnP5ERI/BCrnA=', 'DGhA0csGZtxZ6JsYZSddihZLRHxe1kNHyu5jUCwjjV4=', 'E34uPonnHUYfTJvD6PEhgyYqTR21XFibLK6qwBI49Yw=', 'JQky57CtzyyE7Uv7YKNra4LlWqlHURV7HUV5Swgciq0=', 'FwpykvVjTAbdO/CatcnE7NSwDVzi81+XK0VVOR8WtC0=', 'DWjLvnconnjVy/UdcPG3W6IV30570BSdELLFDypPO4E=', 'DK90VjuQUl9kWm0gNuzRMG+h3GgLSdnOTtJMl0mXMXg=', 'IKfRwKJ/zOeP/jcvTFgwaxZvlFbtRs3rJV45W30w1Co=', 'BiPzImtUcLJ4m4pTBA5ERDOF6Wuc+gvk01AVFYpGhGU=', 'FjIwhojCXnkPV9aKU1AkEkKlYwU0feSlAJzka4zcuR8=', 'LeR5Om+ZzRTj9mQiEfTQt7z6NhWXxUT/y1pWfpB29H8=', 'HU0G0Z6hsJyteQhtUb3hFyWlVPqZVZyi8J87tz1yjGY=', 'BIDnR5pmp82ephyLKJdDiZCDUKvEqvwYzXXjPdEwwUQ=', 'MEMLAzaOvKqRJGlgSQvPkX14aBRj4ufXRL+0QzXawk0=', 'C1ezcyASfUxQ8mkSSw29yysfE1IkGl0SEDKD4InAx0I=', 'LPSJBlDSckDhlfYKT2mO2iSbjdYUsjN2tQF40t9tK48=', 'HiIcVSaJi/0S3oaFGg2XA3UaLyOQCKtfm307aRHGQYQ=', 'KOB0ha19mS7RpY8ynKEq3OTsaT6927KVLlTTOfLuvaU=', 'L0TWT4TeFtxnvV6tUe+x3IOByEUgwShU3V7zoHms1OA=', 'BQp2vDLr0d/ivjMPME7ces5xZ6t7oVFvQCHGLPDU+sI=', 'L1jEXl1lmmfXgTZyQfbDXYy0Y2HZeyiUfSlCHCcFlKk=', 'JejamuDkLoQOBLIwNw54K9tnU0hEMlujb8fl4WDGanQ=', 'L+xzTaIP4yAD6gTxJ/hEck84o2i6EMKVRCUr55YED38=', 'KIpnePOoOYio7Rcn8V6TtMsU9OOju7kd1tH6yv/9Xu8=', 'INzGx1/Yklm+f0BnULPbZ5olqM0nFdJFuRdTkKySLIQ=', 'F/QroQlC3yXLilQXgqGLb9Mc+WXREXjHsErEW03qXdM=', 'Ao7rhdEVqQQCDgxhSO7GYD6c7avGZKvudkqv1FWYa6U=', 'Cx187POnmyrT+imPbOp66V2AwCmezJGOn4ycPTjVnUA=', 'BEAznJdkzsecFu/bg0omJh244/Es4c9yLSPA4R/0zwc=', 'BspkfClyfBlioAIXfaLVBPSwel9+tXx5uI5reru9rVw=', 'LqEgqGT1xAk90ali6PATx7jvd4sE0rpb/DyrKGGbqeM=', 'K7c3VGxK7nwMwrqHwRV+KnfEeev7Xcdq27Oc+Gl2M/0=', 'DjDaZJBiXTPnnNUBdvVo+aLCjC9EmivVGiXRVoaAOpM=', 'DffKcnihNlC5GdhUl7LrsPcQNafCBDDUEx2QOrf1dSE=', 'J8xYn1v1hXlKus5Yn7inSi94TAmQuA/KppRAl/hw4tU=', 'IlXDajjIc13kXO30Uq+oQjMtMwQveOYMQ8dFVCGzJb8=', 'Ez2WAr0zeNafaBwnsFvf/Ji32GzKY9c6YMrtSFeE0Ic=', 'DhVI6UKunT4mhgaZuTcnyBeplIYWyT70rM2YGx3D14o=', 'DyDw5V2TaJ/gnsMS9q9HYnSC5L3goWAqjiyNboTopq4=', 'LlIyhIPLW3/y605FsS5RsmIyybwXtykpVMCp9r+lG7k=', 'ArIWLVM+BZpu2iq7dHEu2zp4YL7qld2KSr/JV2YIBPQ=', 'GeCSdxXRzG04lCmUf7Nzfa1zOXTGsuE+Wz1DJRlRbHQ=', 'DTqABFfXd4VjYwO4uU8X3P/LRgSIcqyfdO9/J+5XNwU=', 'LJdNGVJVehqsX3uuSZZhbaYZtz9EHE5QTcj+nPtVnjI=', 'B2a/7u3izPNwjhtP8wcUwiwdQ0zb6PVVFLq8LdXZe+8=', 'I9rI6lQIL8Ex4XOuVeRjDNTKfIcbKgpHnB505/GR5iw=', 'F9X7bCyzcBDj41irLVdTdocO0zGGuOrkmtO0fjQKjX8=', 'F13Kx22KgSYTm1g644hTKQJG5D54P6aQPsgAfxeMACM=', 'DE/Qj+3l0iGtt6v1SYmMkeW+foW/H9KmEb8YLMLnFlU=', 'J3k0uQnnLTo0dbsex2arejitWbEoMD/FAC8Cplvf5yk=', 'Dog0mZjf5wPxsYRST5w5TWAEzKz5y5UolujP2wsHi2g=', 'HxsgeLYLD84Hgk4qK8jK6O5nNRSwBwqLRXEMx4y7mUI=', 'LrFVlWbFNt28MW9kgtUfo0BVdldwD1uKhG6BKg7TNNE=', 'HE29wzXPZ2Q1Ugi0ydJD00VB1iPGad7Cw7oGa76vZ3M=', 'I3SmstpvjKuOXP6NgF3Tot/KHot+ul3IV0Ah/RJB47Q=', 'Gd00JTPMxgOplzjj+1pWm5TvcbPkn5D7h09hYXMwcvQ=', 'IX1m22x/s+/6UIgAWH0us8bQPYOFEy8vzOfzXycFzM8=', 'CBX7hZH+AQOM06OziyNvnvynfGGNO/xsKn+okpbH5k8=', 'K7lDtAwr1FamwXhTscqI6w/zb1l0sv+aX1CT6b9joW8=', 'EaUVP85llRPufLmXSubLpYHjtM0UVwxXCf7D2NP8guk=', 'G3K/0HY12FAbLv+HhaJJW650x2U8+Q5tXJ8URCaDbfQ=', 'FJAsBwDuyJeuF4uoyvhQ15Px2HUSvqDs6jnPax/uIz0=', 'CcE4xuCmFqSf+Q1DprBD87dFt4hlhW3EwaReL9hMs/Q=', 'BbWKPc5XsoGicdaYlQUtiHRYpxV4PoMX4CSmGjXsELw=', 'K+jSlSXAz91eazEl473jv1WOVfvoZ/AkRXqWdlR00Dc=', 'Bh1y948bqdxrTX93hCJdaoG9/Bta1sJDafnAVgUj2a0=', 'C/GK78rP+r30ES7drcphRXOLSAOzYUW7lRbbUBoGkuk=', 'LnPdEF+osuyTHYzfKexnnjqYAakwcafV6jBlklXwO8Y=', 'D4RA72Z8mugTN7pdjJJ6U0fecpaGCyEcrR7L+101mO8=', 'AE0wOy3qYnsnMb6D+TrDTn0U0XihOABVjKc5Y5XrEY8=', 'I0VBrXIECnDaKZajUmkjDJRpnu8xOk1IBQgAjLw9N8E=', 'DRI/HnLSa5K92P1z0UKGwxKtTCOstGsuCMFXEEQJ4XQ=', 'L7Ngd28N551wmO56pBI8Be5rBai+Rgp3TzoEjhOFRbs=', 'A2hcB5Q04WcnbFfTzHlwO339xBwVbqHot/mbaValUyY=', 'Jgrw4P/8yXcsFjGxeTRFZrR6qto2geuQNMb3XDcFwcc=', 'KGK0E3T4m2lSdLM7dz8lVJFuK/+f9nJUX8L0lWP2J2c=', 'AqmRL+FwMQInGJ6h5pHQNi8Ys4tACw7/GSyllRPrqNU=', 'COUTreaUoNisHz6/GpZEDTLHE9UFjhIk4HA0jCgfSm8=', 'FApKQx4u55QA7XRll42EdzITxigmT/gPIax6a2c9Cas=', 'KWr00BnLXffZWbKdVJw/BxICtOuotT3F7pee0UM3eSc=', 'AYMuKEp/TIFhSIK2k5/A8YVXO9ICPj5QV2VHC7gSs0k=', 'GoTVame/3T2WWr3NMpqnjU/pNDRJby0QOGH9GdZtcmA=', 'BAy4KEd3OSfSrv3AdIkDep0fdjHsp1yfsN2gy5294UM=', 'AQ3PCEzCnLfK7PJqpjO85O0rAZ8oh87nsaePidP6vi8=', 'B+3CKgkR6iFEJe9UK3dtsjsP5YF4ENQMcsqYqr2a+oM=', 'LupKsIrsd18hSEeeo2+7lpNtpYuki9HS06zUgXOqq+c=', 'HkDA6CV/5KYQBc3PrRSM9/R9G1z936oIJzhpVRgkXxk=', 'I6J4CVg70epR9DbeVEPhCPadRM31HcHwPiGUi0mAuHY=', 'LkZSsETb/kDmO2sjL81fPzmr+9IFHuaK3HVAgNSSUKk=', 'Eeer227Lr8Ln2M3v6ce5xQR160dds8LK9/fWf0hXdfI=', 'GZ1SNQzDDoxzgh+AIJbw5UehNVGye/a4mTlvY6xc+Oc=', 'D1ddbuZ8vs2YNFYk4DKjfIWafL7zCz/dyUnNCXhIQQE=', 'HEtvmiritBjmJlrLqclrBhhNBwKOX7eE80da53cv8Fc=', 'Lctc+Ilt458ijhV8DFWT9GJvubwiUgY4PbIDYKvwySU=', 'E0CrufThExhr3CbL30vMpQtTGhB/hjylRFdePPhw+OE=', 'I2jmkrcnh8uIcOqIjnFOAG9Z0rRGDPt0xIqMxzsdGls=', 'H6ua3ZuqSk9W8jFld1xvLZIqdjKpT5Y3S33IUnVvVLY=', 'DH97gjANPGzj+JV7oeSt1UxMAV4g2XZdIgVxwWq4aA8=', 'FdY+hr6s2Txgg2iOXZyPPGlHkp+fH5mrV4pMOpIu/wM=', 'C+hDrl+bB+UlcheK99ro7QXTaxLAYHhikpNV6nQCPZ4=', 'EzJ0nFI2lMtpNeCWOgfoGwWWfOHZUMC3MQWOySp6DJo=', 'JUOUCIEOB0wL3UWYuYFf7okruVylECns8Am/+lubloI=', 'BX6NGd2ZmpGNopsJQLODup/RXbCw9kmW3/Z/61X5p0I=', 'HgFON+mxF887SHDZmfK1XTU00Ka+mOnjV/pD8B5wop0=', 'Gk7STm4DrrzWvbEAUz3JZll6/hXIUbS4Y/boiQhMZHk=', 'JTQgAHCD8aqGOtR2CQXBA57UERyfBT8ncQRS+DzjapA=', 'InahRBlxcJr/5tKpkyAAHsRexyFVxXXd7srA4ydZqwY=', 'KJV90SGOp5n9NBHrGTJYU633rorhKB91MwL+fTHfp7A=', 'L9klcmq3lMiL11eWqj5/HmaS8pFM+AImfd8B43kCoAg=', 'HPilycdqhLFHyCONklPNVbR8DEPYKWbEY2ooZ0cF/Zo=', 'A3PLvDBuG6uecHc2hxXmIwtLLi5KHbnGdLjDWaQekQg=', 'BgKD0v5/I9/1E9kRCz3GJEi8SPUxzgweq1kgvyMpCkA=', 'DatGXW2RB0DzPvbMDq3HG/gRm9/Vo1J9yLv636pAJjw=', 'DLp7y8giSyqOSroXl3IwpobNZCHcDKU0bzRGtiQ5xMM=', 'HkNl2weQycT0RbBlPEZv8h25bDi0B2uovWi8tN6mkR0=', 'G7LbohmamrO8hu9fnef2xcoT1g6rQs7WjemPxkOACo0=', 'CtPBhwxtbvQO661SEjzRopE9nWLoC/usroEuCCAh+co=', 'AbCYyR57DLtcNFiAd8Dd+VMA3fYUk1YwwM46JickUwg=', 'Gf1cDqwU+udZi9TO6jseKZiwwWhJO21yrkG1duVbnD8=', 'DUdJ15zBY/FxEKQEpG/kJ8ZDTz/me357TM+mq5W9fhg=', 'Hrv+gRSkG7gJ4LMzmSQSMuuUCthyjIpRbUCtpEDb/c8=', 'JwTlthM9l2TW0/F9SdgzIj45N/gOufrqu/upuvS0wbg=', 'IWXhyAJzBbGuDjI1cWNeXVQNE9cQw/mjkLaRPxTQNeM=', 'LjSX5NNf2llsBq+mO8Og8uVdTuukrOtg5lCBrWOqi4o=', 'Ax2kNF7s1ttsD3sHx4Fdet0f4FRtc49NeatcV6qEHt8=', 'CJ7OVOR6pckI5D5fCHN8FDaWcIkAasqxyc0Z6sSiCHY=', 'L1PBXire0zxH9VoHBIPmzH84Ifv4qkBnfQVS7Z0Q2Ec=', 'FCqjT0suitDfeiGz45wAyLCqKFcJSAHqr9cr7+0Hf5M=', 'F66k2kx7zw11iLAU64tAl53Scl7aTmrOMxmCRnx/8r8=', 'DpcMGdGXSNjEZRBNjwIgA2P5pBeG8C8YJ3QrINwNFyc=', 'BLytnlU3lWQvWbr3FKa9tDL8RaCgt38aujqYI0dt+bk=', 'JCwL+82qdvcV29S6glxx/P7WccGxkB+khMh/gQMV0M4=', 'JdsTQ8JBBAcQI/tu002ZCQeDEeHv6FrwoRsZEU+p55A=', 'L/5NnEIKWenNx8Masr81GHyhR8uJijlC3rNnd4YDaoA=', 'EluwOvPizxi75vW1kOs7+NDRumO+aWSD6Y8oO8fNB6M=', 'CBa+QnRbfbtM7/5bjiTqYP2LcZ3rpQA3rHt1lIdFxrw=', 'ERFg+az27DYNG2pxIxOg28viPmRCAFVHHS7kxd7bNdQ=', 'E3eXjhsfaokl+o57eUG9+PtZq5VCNCQZKD2CA0Nck5E=', 'De/B2IghZu88zeU6TyNvuoPThGIZN87lfkIaUT0NM5c=', 'L4+lx4xwbjpdSgPyp6OVMEbX6Uy4in7zUOZ7W6Dw3r8=', 'GiqVfsCnI9phwhNLqwvxe+sA5tzYRpDCMNy55Y2pSCc=', 'HN+HEJlfXgNBK0p/aZUy+f0B8OoWeo38Hd834oBa3e8=', 'Jv0xRxgow2rjbCe3SAVLDAxP5SObMBaZ43Ze6+zBiUY=', 'B3XZlswsRFbzA6LB+QB2R+Eakh2f6j97kmFDuZ0voL4=', 'AW+5M3cIymOM39qRvQ2uprlyJO97IGJnKt3RvRi7iQA=', 'LDkvvn0/3kL8pPlHi7Q5MxJYJVNW8YSvb3bxGQVBF9c=', 'GHoqO/eaafo+UInvnx/Vb9tHxV7s53qiKKo94bSGvLE=', 'AnGoY6KAoyZB/6M1ELLt0njJhjA1lTLz5Qaydf1dIM4=', 'FVdFnJx0yUqgDlr2mh4xEvtpU3zol+wMcYlY2WUW8qs=', 'Ko4myo1kfZpjiFFuqdz/iQg9U55YFowqUMba4w8QnyE=', 'Ict1IZTPQ/O1GULrAEDrqd4rz7HCo/rpeSS3EPJoMs0=', 'LCba+Za+JHrNbdSsrWDTi1pHHmMiGI0CwTfny0hDd+w=', 'AkAXbuDnmC7r6Spo0+OjjCaCGswPXQWM+ME3vKLSbxs=', 'JjbglzyGXBvZdN142qqNCoTNr2vhrUfs8qDRjxFzGPI=', 'GehPTyWnmUlgQWYdxdl1toH24GdEzuibe+XZ/eF0SsA=', 'Dr+JBko68kfKHzb281cBiOJx4LMmxPsmZk6J4UVMoRA=', 'Jcfpe0db4A6LVZo4xFI2T0ycUx/suKxpj3/XPOIucew=', 'BETJnlkjU+WuyqMCrdkBwU2MVScKFgr+1EKe9VmK108=', 'E424iHgwVl8mk9Dg8C5OeeFEln8LpTsDUZq6dktcmUo=', 'JNQPRiEU/p7gKq/PdLT8ok4a42XcdcO1K7E8u7LyHt0=', 'IeZdbY7kN2C8pA5zC130xM86inMtsUj0spUbTGHWjow=', 'JI3XlmnsCdvwNQoV1sdcapvarO/KFNUTAJePE9GrbRw=', 'K4I4wVSPnL4p/TXPkee0jw69p+Y57faf6NWrp5JNU2I=', 'JDn9I5JX84GBx7489RPxv3I166lPa4lCqUy93s9vYvc=', 'IAlYI1KBphuixL4KoygqGMdLbSYvXefC4z0rs+iT3+w=', 'Dh7KXfiO5fYM+n4f5b77txn62CEfqbLQL8wjMZDBfxI=', 'JrU0J/mz6ix2nZxmD8YIgaFpwScy0AG3FY7ksbhCyiQ=', 'IPOz9Kyv6fivPgZmGzqPd4+igSUiudcKZ0As/42ysbQ=', 'IR5dKznWJSCnpifs6MrLrJ+XUG3vTsKGkoumwn1GOxc=', 'C7dD7jSAISnFVnMa7Z0wLc0IUxPOVy9iQtE4MuU2tLQ=', 'I8smYbSI7nHkx1P/I65L0l2KRAlPZrZTKXfiIUDrpcs=', 'A6NaoxI5Ec20U1uu0zWfX2pSBbnJPvMdNTI6R4B7i8k=', 'J4A4SKCu2WqT+pQ7ZjXkUCF+E39K3nSmLXkXMicUtpc=', 'DLN4OcLJp/95iEy+x19B6b5eR8dtYVOCMb2BYpltb2c=', 'HwAm0L8fjh3VQjzC/sH7XNqh7NxMPLIY287vd8ANL5M=', 'AqfXu5cLim7S7mb6u7qVa22jsQD1tfuSju9C+XCCc8k=', 'DP1/QhXkNMjaF+wyWLC8YFrRqy6QqklDUeTuQLvEkfo=', 'GAsRtyBiKhVoSdxvf25/VxZZvmloIjDF7ZrDOXAKfN4=', 'BOlqllvOPToKJKSkV8lRWCyHE0nOfu4aq/5XipTGUBE=', 'FZMfeCtF9/tlbyzb0fdwXDU6I/4dMKWkahUi7RYN860=', 'LiluV8l6Uwms0m/r9VrJY6VETBxfcDrYig17l7ndOLE=', 'JhV7zreOhGu7Ji+aHgbUJxveWlvOjwQZlS+X/9E+rKg=', 'IZTriYR9aw8Yl/Z18ZwMVrYbEySO/zyjbjT7nRx57kM=', 'I1C/NUd2VomRUa193pbqeFfhVQFEcAjatrPSfI/6J08=', 'GkhvCuWRys2vCcWKScTReVQFQ1NAgZ4APwRp0RC3dSs=', 'G1bc92+yPMSoNNRVpAZeEzVxQCt98wnVm8MQXUKowwE=', 'GnSdeWSvC3ICkT7yBMZT8rS/tlzqt7aFIzq1nOO7aSU=', 'GK5ZAHP5aWlq92L/pOjw67+X+Mx4fjfN3R8yG+O+rbs=', 'IcR7J12C3eZGDV52mplCEUSxxanaWSlK3py7MXED8kk=', 'BHPdvVLnN+UnNk6OtjIHl1w41f1swysnIQKwgs0VGPs=', 'CxL6yVttOogdiSZXyEJOZFrE5rAFFfkC1ZRXQwKybgI=', 'CK52FqJgz2ZX+Pc6woRYjSxfB/9CXYN6p83O9j4+IQM=', 'A52vaHYoC4Doc78qMv0oNKg8aXV7rdWKiI74Gekmzig=', 'Jeex10cKPHXxPwtWVGyOCfLY7+/wbvdm+ceDyoadEw0=', 'Ho/TY0w/92QYTQNDX5hYSxG1sVrrnHUmLaPx6iwqnno=', 'JB3MUaw3gIpBXdHjwoHwWv8ReJ3Ayv3XejVITgmT+aQ=', 'H/wxU8Vu+XVZMs6ivgVzdJva/hxPoHgaS4tAeM6ddUc=', 'F2MNYtmj5RDIik1Dw2D5K8D6ALZgMa3sKb2VQ/06F+4=', 'KYBADt0ddOPWnbVFjSzNX6vbI27BaoKkMBoKtZ6kpuk=', 'MDT7JDZhI+xtyvytNXJtv7FhlMA23NZI+mlDm/zQDNQ=', 'Gqfo9Bicqd/z2yq3ZIvgojkplc5GBB4EaA3KitcjLfA=', 'H6GV+DSmnmI3L2DrSX2hZ2RurhQVPYA7OdxdEfXXgAs=', 'DyPxx01fv2GVrVpq7l5WmTxUd+hFP1uToNe6/TMwNtM=', 'AWVW+sk0inNatQqgiclxUbPKrwogo0+52TcFBaFRVyk=', 'I9kreTZIEQ/Fru8GM/DHfKyw27yhh5uKb25d9EXl9ws=', 'LkwQ7F5l4vI5u8Q8EwMd8mhqtA/XmjBLBdYRuCPyO3M=', 'EkGLv9d7Y61eFoZK2cMv+/xaPdm3jsK3kyn+XgqNKVM=', 'HkqKrOFavB1bdqnoSEMdLAanj3K2vrsSk+bFjlGFaW0=', 'Dz6WEH3s29aHLCDqCaz5LN8Xo+4dEzFIgJLZYXbet1U=', 'ASw3gCB/OVzCHesKvZUWge6jJJjdumzol6j58MI1cGc=', 'E+qxtOZyuhscG7kBdpMB8eVlnQPqEMYd4kd/8KwiFCE=', 'INxmSrsgt0VsBmKc43oeyxonpOiyTjG0i5xGNaowMj4=', 'LGseLP6njiw2eF52qM+xsFfpRx8k9bORF1w97LAeAA8=', 'GIySYlX1t689qWNVcpwqhnCrTCxwQASBsqyQN0Dgxas=', 'L5kTII4J49bp5vumOE/QdquJ8mYpduPjDghwuzDrVPI=', 'KzOAPZCIlwbnFPcgtWKNJvtgtUWh8+nOSaaukSsCQIY=', 'JsyrwQ6wQyfLXMPd4quzbwlwhsl+c4wTPJ9XB350iwk=', 'GxauDXxUQIy3X9kx8kZ1HysMPcINeegqJTG3bCK01d8=', 'EdC7RhvYryhE9J8PhAyU75UYslETRHQtH1Q4/j1BWuQ=', 'IzAxhHtHa+rQEY09szjokTPsQg1nPlBK1kclnfZVVx4=', 'H4TpeJW+5DjrPJLcmxhGya0pwWQ4ewautu0YQe2MTco=', 'J39/m1QvDCu19FvtBU8JYkU2AQw8+UUtInMZMyf4AdY=', 'HvyckGnlBouqwT0uZkVkG30n6A/CMHcWFTXERoLuV6k=', 'DW7Ed3YeLvusTxSzvz1SV6meZMPyX+EE+vmIsg/l/0Q=', 'Dg59fFUBmZt9Fhc7WbfK4fIDvvIa6/ACUYgUOcz5MBM=', 'IXvvL08SxtzJHCBYojORy3feU8puRNzcbqPTb+oybqY=', 'BXgMiK3wFTG1D4F+P+RER9KbNaqKOJxx6M8SJqzvaLo=', 'GHM4h6ays7TJDY5JkBluI0ReR9fqWTnr+4mj7j1ntL0=', 'ILrOY6z8rgscnyvuJLjp2oW6WX03sJBXIMTxXbIxsHo=', 'Fm6llTdaZ4asUn7p7O1z7Wv1UIdqvK86yStCyAiwDY8=', 'MEJiqe/0BArPQ+Mi1vUmdq4vhT7C56gNsAxIjPkXx04=', 'ImuscFAWbl9tt4zQsS028wW26MmgVRFK13Ceb1ckW2s=', 'JrL1OcVzgp9qypG6qVRQW8XD604d8dY4WCcX+98jiMw=', 'BqD79M1S6Tul5MbEr2XbAu6WKX+K0gDy8c/yUudptVE=', 'LLnCQRLTU0Gs6siDYPtSiSTli27KwyG5+ynmqjNo/yM=', 'IOiKTWB1Jt0H/gijVSpEZpEp64f8wLE6rI/or9kwFSE=', 'FURkmivXPjunLzlt+R3WVAHdj69R3jJfuu251TatlPw=', 'GYAHdFeZVxLETafhdxMljj+Os1S/2A7Z6vPsuvaWAQU=', 'JdHSL/E+dwXTwIX5f8Tk9pFLgv+qXSCR7GTaxCN2Xvc=', 'L+yZDvVW7+EDWkZP9VgedAZ0Rc1Uq8r2uMA5n+DSTPw=', 'G9lWNQbZVE7z5IMOE1RQEsV5N5wtzBMwQWxK5JvE7GE=', 'AK/80XumADxW36hVcfwpc3siWoDUgOfdft7AHxTyMBA=', 'I2cNuu+WaIHwf5GaLYgxKMeyPPdnpHeysuB2K8DbwYs=', 'H5OlMpFzlMfiL9F6vupjicZv164t2fAvhg9tlpR/Dt0=', 'LeQun1N7fWGwITdxwOdPVVUSvge2pQk0c04sW+tAvjc=', 'JcVX9FuZeBzTfTuyKTFmKmf3izd4LIhbRWu5bVXohAQ=', 'IHTItwlwXJiIU4p/ijxK/2R3Mb0W+OJU+nTqnyvnZiw=', 'Jzg1WVYpgTiUnkQhcdak5LdO8gZXQNt8/DoLYP1XOss=', 'E9Nq0KTr64GWl3hkllnGXLfQxBzFGYcf23Gp6moMqlY=', 'CKLBi6QTgTSMGs+/lhdxaAa0YqFpG8LjQ7ebgIXjdrA=', 'BZCS/Dla7ShYB7v1V62aEEH1nAeYIrEIhFeIL+57YSw=', 'FhkkFRtaWtLYysEZUiqZGpBvFehTHccFZ/ayg3HMJOM=', 'HGjKj3qhdlkHVAXvY0G45popi5pNcvO7hUswnkuoehs=', 'J/XQO8ocggf3I5pLLPc65VmhWqN+e93fOqsF7sXOVZI=', 'Dsv/SEaWKpddNH6pqPxGX7RoYVV2IvLCVkp+Y5gzwWk=', 'J3xN4jY9i1tFbPxaf/jkb/LsjapZhV9a1kvAUh86xWc=', 'GxGGLFKs01G3pGR5P0+7V/7Jn4MrYyJvldF1yNL8CLI=', 'BqcZxYTHT/vdchjrVly0yL2GyS49+zxz4VJyAapRI04=', 'Iw5K3uy3mYd/fOmljINrmdUzWEoZXB13oxOr4cfRJr0=', 'ELEJuGSAnEdnoTPM5sutbIhigXO46lHozKhYMMp95SI=', 'DiEReXDc+9SxUmslNjbzd1ONO0+q61qLJL9iANFMxZE=', 'Jmc0mXhAE2L2sXk57rDmT/VWB+vbNccHHbRrs+e6R3g=', 'BQAPpf2lBeApoTv+MEwmew2GxywDm6v20/8C7iRr4C4=', 'Jk2eCUrtX0GmAkIiCjSihAiQh7JDapv86BdMyb6MLiA=', 'CAdvnEdD3mEw/2Is9AHt0skvJL/hFPPF5ySJF0YxXEc=', 'EyNwq927Cx3VfypSDCUza9fO3pS5W79cIVHW2I5kG2Q=', 'CP8RFreiJ7/f1EZaZ4kIgrYVyMTBfyjY0klY7fYC3cs=', 'K8sLDbi54+ArfpwclGD92cbNmFYjMuZI2KPgq5RZdSA=', 'EupozmiBvsrX+KaxF7A6uXb3q9WX+QOwvyMNINIalDo=', 'J0OcmKdmiAZ6CXsZtv3X141fiOJ04Nj+peprdAb92n8=', 'AvQNCtBfVlLjHvlECtcevIQZ45NJOTfwXwBJnQKpnjY=', 'L78EKEMn7k9oDwa9OQ4wnQ0TrMdLnFsUtjBZuMx6v/U=', 'G+aG1T4qitV6gosGUUJc/Gl4xwJ+2/JH9rZyPCHfhuc=', 'JoO0JehaUI+WhS8UtCIPz+n3rYsXv+/A40jEfKeLtX8=', 'FtrOmy6AEuMdscfr5nLYa75hoao+FpPg7d/A3gqd2VE=', 'J6Mh+MfTyQIuli9/7y48hItFOdu3WqE58wQw/lRbzts=', 'BszXIQ3uHWsOIreeEtGQgtgHi3iNcQB7leendO2GplE=', 'CkHdQiIWU3Ur7zUPbXSpF7bLsf12o6EhZvTQvpeOQCY=', 'IgoCiB5NR6yU2VDN+DhidNF4LifL0NhFl43uyRKY8WU=', 'DiFVpUX+Xzy7Y5dgZYnqwZzZJjkznGsBcpikrTQItLk=', 'Dw8ZxikeUVRqJnxgzHdOX7nQiLrFMHgtiR7Br0uEcHM=', 'DpJbzRxt20o6HGfsje771AxTwNM+eu7xtGeVrtWUPJ0=', 'KtAAsXSKu4Es1uVBEoa5/z7wpb09JZo25F7wW561vus=', 'CmWqIy0y7W6N5j0c3/68Lz+mFkZcJ6r5fozT3P9khlI=', 'AmPYRwq0scYddNjoliQvTyYdyxZ6OgaSOJPXyyyT1qE=', 'KQHZRq3clLBA/VgATZpfjNGSZUDHqGEs7BxYy2DCs6U=', 'GInPqCCfSVLfkCLbncWDtXF6BpbaQc7mSTfQzWMh5pM=', 'I2Bk1xy2xkyEdHrCX8+NiBUC5fA7/4dWG4WhFrHzmso=', 'L/ehdP/Owphi4E9dvcc+vzZhVwAzV2KQwMH2zYztJ64=', 'GeckoddCyrEDRV8AQO33RaJpanEITJPjInFUUN1Nb1s=', 'A+7TiStvDmxdoQWcXzeTmFg1qig1AKgSmQSpTIfxYb8=', 'COK4Jzv6MMGshQMG2R5Gip6NBQkq7ky8gMaHJIRjujA=', 'B63Mp22DN3KIOaG2rDs+1Cr7h9cq+Y9S9Bby7FiyjOw=', 'Fx7zeJa64rECCgpYOb1ReEzhG7QjfVSMFxFp0y+hm0A=', 'IP/fy4b00AUGTtvClpGMMy0y++/xcp3lBWomq7w6Nfo=', 'COzXpvFzXu2GuqCU5gj0iPONuzmPz+1LmUODoMqORkc=', 'HD9dhuWSH96YkBifHYxhh1QohgDmkovBgqxNXkyfDMs=', 'KcYRhO2dRg8zdVihr2Oap+PAl15AFO2OvK1KJdUeq/M=', 'De/UWyiVhygiituy29rval6bGmSQKnNPQCuM77irO1Y=', 'CnTqItigkzYGBhAXmsHYL/+pSS33be7U6mDgEzsIEag=', 'A6N78S2vFADSl6xKwTuiTBfcJi2xbIUj3u5ODM3ppoA=', 'Ef4XkNWrv1k1/yIxjk9//mmWatovkTa1T4MOrLCmU2g=', 'AYFlhC9AY3XyNGaGkVr7FL8f4FZMiFjuO94Kuj3l9o8=', 'Jh2yXnz/Wp+3LydrH5JgtmcwD7fTYbUP1cDotplbBfk=', 'KjrDMUsrZueW++Nt93jF5GlyMgzEPsgHBIgmtnBLp8Q=', 'I8qkuA7PqZ6dP+orvB2782nRv8iTfQPQdAYcMP2M12s=', 'J9smAIXiJImN8UXyP2NfIGbY5OEk5YHoxiYZKbHf4Qc=', 'J09sX9NKeE1rkV7wXUJO5sC6u/Np55qxOLgWe1YY7H8=', 'LDop4TqE0moJEckona8apM9YQKraBwHVfiPfx5babaE=', 'HqIQ8gAaM00+gB9OUycNQtp6rzF6VTtCgqp46qIoLm0=', 'JU2+tSiEtpnBun+g1ugNYQkDsYo+UJw2NRzMOwJJRuM=', 'BZ54HWWJbr4OS6JtwvKZB/R7ze2kososcT2FBeox/V0=', 'C1sc7GPULV5hXcJpuIWiTO8wPseMly3RfNuz6RXMT/s=', 'KnwBXpw7LFfKi30m05obzIXW/6y32fvWbSqPHWTtDJI=', 'Kbc2uRHXGnnPY9im94bxG9Wr7iQWHcVnp8hR6uHkO1E=', 'KFdFqQp/49Ca9agIcEvGnG8XAeVzkS31zB4mXVlsQUE=', 'LZAbgZXDyWyMNuuZ/sATTsK4MEroEL0w2lVOMICCZxU=', 'GQXTUYNV6rp4WbWR7XuMnCU5gPBFDb31TXp3groFg5I=', 'I+gTAm/AuABk0ZtcVCiUL99+/qgL+o7ECVJyv9t7TJ8=', 'I8ChmiUsh+axwcIbGnmAAgDD+/8+MwDn5VaAcd6e+4E=', 'EcSuYHuuSSQTv2LNqiwoaO0f7G3AYxsGfKYPqxJbnio=', 'LNBV67fuRoY2XepFDwRv9iQF+uGxr8n7AXB8+B2g47k=', 'BTyf7y4CH6miD62iL96hUFtYoxWbu0czfb95GyFbFFI=', 'CjW9dOh8urqr6JrRMZ0snoY7TGMcIZOMmlOVv5eHKp8=', 'HBFQVlOc4gzVoE0aXEPisA++g7JZAb429d3EZm/Dg/4=', 'JClUBH5Xcv073tWQ7IvrTFQvLiZMjD4oTNxHNQXFGpA=', 'Diq9MVtHwNyThJwM3yZ+gRy9vbIApufCtn7ffLAXQhQ=', 'KCs3AgwIkNdRw/12lQ2AaGaOHf6uYh3VUtLeiH2i6nU=', 'KJM4UiZrUtnqa1u5I9nZTy5aW+XHeOdeB5QsI0tkO9k=', 'CZq2dlUFuhGY7xQOd7eVTU++eaBWznK6zjnASMANo88=', 'KvIR2OCsLY/af4SbjyKaIlxhhrVXYsensq4tHdhcV8s=', 'DNBw8jQBSigJq5DHHB2mHpipYyL+3Zm2qq4coQTz+s8=', 'Jnk+KryNPDDGBib7qhWPJjWH1r0Vgz1EixFiZLkwJWo=', 'IlvjbtDuheH4Ra2oTldIpWaZFSET/2G1BWtti95gwZ0=', 'AhdPSe2wLVFU0r7KLckrnMWVOD2h/ejwnkte4+paBl4=', 'D2SJHCyLAg5Gw1lMt1jwvdzb0JvQMIgW+0FzSoaYcsM=', 'GSqEyi+Z02mR4tKx3v85idHBVsI54Q6fVhQOGFRXYGc=', 'Kd/Ne2PwWr8nU6jDQda3pgxiQ7BMmhuLMyC7oEpNR4c=', 'HuJ61rm1qGdzOvxhorPnalK6PkvV5let6R/AOIGduls=', 'CrR3PxUMP4rTvJU49DzsOVp+NzGulz/v62I6CSF+ZMc=', 'E8NSoC9ZUYYgLLC5n6WMVUKrZ/m206Cv0QPe7/bYD0E=', 'KpfPLBDEv7/SmfZ8UqFp+SwFt9rFakHE3U/ofIJGzhQ=', 'AL7LtHBCvX+Mn2u0IhYtGu0ImihIL3/RarBqEyhf5wI=', 'AI5E2iHXOGkbiBdX7zftKcW9n3pEUPz1MpCpLMLKIXY=', 'KyBai21LcGPZMfO7XTRkBThD/n++S4PBeIP4ZSeIKhg=', 'LZ4yp8kFVv4QjSVawB513zOPzWOyv4TBkoDUJymIY/w=', 'KaMiqEwlvS3fbi5CACKNlavWNJoCJmrB27pSBzjOypc=', 'BnjJv8by3wEvT+VeM7torBTO0d8NAhUnkgidBG2CjEM=', 'D6/zpedCV5T+IKfg62FbixdgOUt/IwQoajrkAJEk2yM=', 'H49bYRr5/rnOqGwIQFgSBVPkBBA67iE/WkHR0CVBwNM=', 'Fgh12EeWAvlvQKzC0ELuUsFYi2op3kKEllptxskw6gc=', 'Fth6UYOjFqHXCvyVHv4s1mfHcyj8/aRYy/X+MEX0bZ4='],
  M: [['EkZm+AVh7VkW8vBwsb0kjG1T9E0nPZVqDIe5F2kqTRg=', 'EZJPAv0ZsJJVqqHPRuoFGOPXv+70dCFglJEBHbC9CwI=', 'JH+n8CIwShmU/1BUVsIgHvm3FzaUmNP/zkRmAe2d+EU=', 'A/17Ge8shh8i93/4EPVOJ3vJTrdsAtedmGvj3N8FHD8=', 'GL1BI5w+cVeaZ3RD7P+9VVqB7u6mk1Kmi2fIVjwMKgY=', 'LXjDpdKN6f81vwoldjUZblcwyn9ASTJ3B4zXXai069w='], ['ClFKXCJ/TOyV36Ap6N0STDSJWqRrsnwJEfN4DVAVVAo=', 'GS4W0X2VayV7haZS7v3y7glYnqxb6AkVd1cj0ssdoG0=', 'KYzgweMRO7k1xwWOd3K1M7GqnbDAkmvciRflYFyjrBA=', 'CUy06DYhr9Jx5BvHFyfwFY69YSI5rJ1pixf+S+Bbf8g=', 'A9iAOVvpPCfWSa9f0ULnazORjLiEHVooFzvVz30yh5E=', 'KO6ua1hmrWjkQ7uvkWgNt9fiswN+OP72G0LLzP/OyoE='], ['J4u0mntORK6kbrD4gstpKAGm5g/dW1wjxjzWXMzk/go=', 'Bj7ewb7YMfUGr422SNb96hRTRYh+i9z/EJA1odm2dNc=', 'G67xy1UJtSakIGH7U2V/mbMjJQDoVRksvoyUDgaMR18=', 'EyRWSse9+eIhZOmFjX+o42ixZerqPa9Otn7lnA3y5dQ=', 'AFdhuMauyxqMpOpN/CyDdgZKSoAEzu2iEKVSQFYt3BM=', 'EMnigxWdWMtMsuNf3oOjuh/cKAAu2ZY9KpnxhheKFI0='], ['DDmen2eqQHB6ID/u+wuVi72tzsXKNJAdJT0CaiQZ9qI=', 'CD8N8/GgNR0DMOw/9gLKjMNTt/bnYscQcYTNe0I0SfY=', 'Gmdk1ZQ/xKcgtMChn9uMcRmEMHKHpYubX59dWCEssmM=', 'ARpjom/qv4f6Zr3mbMJakiyWOC12xqf/SPFTe+rtaDo=', 'CMp7ZGV8NUjzK+9bY60kKIpBwLJRCZrSf5Q0MH4+ZNQ=', 'AZmCcEcek2GVVEawzbi+qRXsBnXxzWSN3LBDA1B6RIk='], ['HWs9X26jacJvgl0jYpM+qjHqNewKd8H72eAcoVI+RDI=', 'EZ7xiLs90NMjBpdsGZQehmS+aH56aWkton2iFabwbUA=', 'LZ4KtcBok9/f0DSBOBuoa25ikt9WCdcfLGSy2aefgJ4=', 'JfFmMb93Bg9+o0CHwCW/E1eEMZ7wjNouMUGe4KUp5lg=', 'FEx6EdpafF2rrj8z+9A8rYbRi8WUx5pJfsuYlO21VPE=', 'D5cRYmJ3I/P+rayyiwwQTLj3TeUIdS+o18DbKvE96O4='], ['JL5RAJVDYgbdCr0LDLuVyIOrMEqlJZixppMG7JgaaI0=', 'IRYQ4q1KN3Qm+t9waLDBpsKZoWTBwaYD6u2USHDQubk=', 'FaZ9mBBBsfbwnz+evv2GTnedOvCBV3hqwHdQXlDsefw=', 'BJMn+nnSjBKiyCQGlH938Gd1sCh0aLMTaHdwHb58lZg=', 'IwlA3MUjJlj/nClpej/UFtFw6MmY8aqF3qDELXn5Uao=', 'GxIcBJzRFZ4okAfgydqZlcxLq0wm+4iOw5cqii5laWQ=']]
};
_5.default = _default;

Object.defineProperty(poseidon5$1, "__esModule", {
  value: true
});
var poseidon5_2 = poseidon5$1.poseidon5 = poseidon5;
var _poseidon = _interopRequireDefault(poseidon_1);
var _unstringify = _interopRequireDefault(unstringify);
var _ = _interopRequireDefault(_5);
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const c = (0, _unstringify.default)(_.default);
function poseidon5(inputs) {
  return (0, _poseidon.default)(inputs, c);
}

/**
 * Copyright
 * This code is a TypeScript adaptation of the 'blake-hash' library code (https://www.npmjs.com/package/blake-hash)
 * using the 'buffer' npm package (https://www.npmjs.com/package/buffer).
 * The 'js-crypto' library (https://github.com/iden3/js-crypto/blob/main/src/blake.ts) from Iden3 was used as a reference
 * for this work, specifically for types and adaptation.
 */
/**
 * @module Blake
 * Implements the Blake-512 cryptographic hash function.
 * Blake-512 is part of the BLAKE family of cryptographic hash functions, known
 * for its speed and security. This module offers functionality to compute Blake-512
 * hashes of input data, providing both one-time hashing capabilities and incremental
 * hashing to process large or streaming data.
 *
 * This code is adapted from the "blake-hash" JavaScript library, ensuring compatibility
 * and performance in TypeScript environments. It supports hashing with optional
 * salt for enhanced security in certain contexts.
 */
const zo = Buffer.from([0x01]);
const oo = Buffer.from([0x81]);
// Static properties for sigma, u256, u512, and padding are defined here below
const sigma = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
    [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
    [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
    [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
    [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
    [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
    [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
    [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
    [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
    [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
    [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
    [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
    [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9]
];
const u512 = [
    0x243f6a88, 0x85a308d3, 0x13198a2e, 0x03707344, 0xa4093822, 0x299f31d0, 0x082efa98, 0xec4e6c89, 0x452821e6,
    0x38d01377, 0xbe5466cf, 0x34e90c6c, 0xc0ac29b7, 0xc97c50dd, 0x3f84d5b5, 0xb5470917, 0x9216d5d9, 0x8979fb1b,
    0xd1310ba6, 0x98dfb5ac, 0x2ffd72db, 0xd01adfb7, 0xb8e1afed, 0x6a267e96, 0xba7c9045, 0xf12c7f99, 0x24a19947,
    0xb3916cf7, 0x0801f2e2, 0x858efc16, 0x636920d8, 0x71574e69
];
const padding = Buffer.from([
    0x80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]);
/**
 * Performs a bitwise rotation on the values of two elements in an array.
 * This operation is a key component of the Blake-512 algorithm, enabling
 * the mixing of bits in a non-linear fashion.
 * @param v The array containing values to rotate.
 * @param i The index of the first element to rotate.
 * @param j The index of the second element to rotate.
 * @param n The number of bits to rotate by.
 */
function rot(v, i, j, n) {
    let hi = v[i * 2] ^ v[j * 2];
    let lo = v[i * 2 + 1] ^ v[j * 2 + 1];
    if (n >= 32) {
        lo ^= hi;
        hi ^= lo;
        lo ^= hi;
        n -= 32;
    }
    if (n === 0) {
        v[i * 2] = hi >>> 0;
        v[i * 2 + 1] = lo >>> 0;
    }
    else {
        v[i * 2] = ((hi >>> n) | (lo << (32 - n))) >>> 0;
        v[i * 2 + 1] = ((lo >>> n) | (hi << (32 - n))) >>> 0;
    }
}
/**
 * The G function is one of the core operations in the Blake-512 compression function.
 * It mixes the input values based on the message block and the round constants,
 * contributing to the diffusion and confusion properties of the hash function.
 * @param v The working vector, part of the state being updated.
 * @param m - The message block being processed.
 * @param i The current round index.
 * @param a, b, c, d Indices within the working vector to mix.
 * @param e Index within the message block and round constants.
 */
function g(v, m, i, a, b, c, d, e) {
    let lo;
    // v[a] += (m[sigma[i][e]] ^ u512[sigma[i][e+1]]) + v[b];
    lo = v[a * 2 + 1] + ((m[sigma[i][e] * 2 + 1] ^ u512[sigma[i][e + 1] * 2 + 1]) >>> 0) + v[b * 2 + 1];
    v[a * 2] =
        (v[a * 2] + ((m[sigma[i][e] * 2] ^ u512[sigma[i][e + 1] * 2]) >>> 0) + v[b * 2] + ~~(lo / 0x0100000000)) >>> 0;
    v[a * 2 + 1] = lo >>> 0;
    // v[d] = ROT( v[d] ^ v[a],32);
    rot(v, d, a, 32);
    // v[c] += v[d];
    lo = v[c * 2 + 1] + v[d * 2 + 1];
    v[c * 2] = (v[c * 2] + v[d * 2] + ~~(lo / 0x0100000000)) >>> 0;
    v[c * 2 + 1] = lo >>> 0;
    // v[b] = ROT( v[b] ^ v[c],25);
    rot(v, b, c, 25);
    // v[a] += (m[sigma[i][e+1]] ^ u512[sigma[i][e]])+v[b];
    lo = v[a * 2 + 1] + ((m[sigma[i][e + 1] * 2 + 1] ^ u512[sigma[i][e] * 2 + 1]) >>> 0) + v[b * 2 + 1];
    v[a * 2] =
        (v[a * 2] + ((m[sigma[i][e + 1] * 2] ^ u512[sigma[i][e] * 2]) >>> 0) + v[b * 2] + ~~(lo / 0x0100000000)) >>> 0;
    v[a * 2 + 1] = lo >>> 0;
    // v[d] = ROT( v[d] ^ v[a],16);
    rot(v, d, a, 16);
    // v[c] += v[d];
    lo = v[c * 2 + 1] + v[d * 2 + 1];
    v[c * 2] = (v[c * 2] + v[d * 2] + ~~(lo / 0x0100000000)) >>> 0;
    v[c * 2 + 1] = lo >>> 0;
    // v[b] = ROT( v[b] ^ v[c],11)
    rot(v, b, c, 11);
}
/**
 * Processes the carry for the bit length counter, ensuring it remains
 * within bounds as a 128-bit number.
 * @param arr The array representing the 128-bit counter.
 */
function lengthCarry(arr) {
    for (let j = 0; j < arr.length; j += 1) {
        if (arr[j] < 0x0100000000)
            break;
        arr[j] -= 0x0100000000;
        arr[j + 1] += 1;
    }
}
/**
 * Represents a Blake-512 hash computation instance.
 * This class maintains the internal state, buffers, and counters needed to
 * process input data and produce the final hash output. It supports incremental
 * hashing, allowing data to be added in chunks.
 */
/* eslint-disable import/prefer-default-export */
class Blake512 {
    /**
     * Initializes a new Blake-512 hash instance with the default parameters.
     */
    constructor() {
        this._h = [
            0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b, 0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1, 0x510e527f,
            0xade682d1, 0x9b05688c, 0x2b3e6c1f, 0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179
        ];
        this._s = [0, 0, 0, 0, 0, 0, 0, 0];
        this._block = Buffer.alloc(128);
        this._blockOffset = 0;
        this._length = [0, 0, 0, 0];
        this._nullt = false;
        this._zo = zo;
        this._oo = oo;
    }
    /**
     * The core compression function for Blake-512. It transforms the internal
     * state based on the input block and the current hash parameters.
     */
    _compress() {
        const v = new Array(32);
        const m = new Array(32);
        let i;
        for (i = 0; i < 32; i += 1)
            m[i] = this._block.readUInt32BE(i * 4);
        for (i = 0; i < 16; i += 1)
            v[i] = this._h[i] >>> 0;
        for (i = 16; i < 24; i += 1)
            v[i] = (this._s[i - 16] ^ u512[i - 16]) >>> 0;
        for (i = 24; i < 32; i += 1)
            v[i] = u512[i - 16];
        if (!this._nullt) {
            v[24] = (v[24] ^ this._length[1]) >>> 0;
            v[25] = (v[25] ^ this._length[0]) >>> 0;
            v[26] = (v[26] ^ this._length[1]) >>> 0;
            v[27] = (v[27] ^ this._length[0]) >>> 0;
            v[28] = (v[28] ^ this._length[3]) >>> 0;
            v[29] = (v[29] ^ this._length[2]) >>> 0;
            v[30] = (v[30] ^ this._length[3]) >>> 0;
            v[31] = (v[31] ^ this._length[2]) >>> 0;
        }
        for (i = 0; i < 16; i += 1) {
            /* column step */
            g(v, m, i, 0, 4, 8, 12, 0);
            g(v, m, i, 1, 5, 9, 13, 2);
            g(v, m, i, 2, 6, 10, 14, 4);
            g(v, m, i, 3, 7, 11, 15, 6);
            /* diagonal step */
            g(v, m, i, 0, 5, 10, 15, 8);
            g(v, m, i, 1, 6, 11, 12, 10);
            g(v, m, i, 2, 7, 8, 13, 12);
            g(v, m, i, 3, 4, 9, 14, 14);
        }
        for (i = 0; i < 16; i += 1) {
            this._h[(i % 8) * 2] = (this._h[(i % 8) * 2] ^ v[i * 2]) >>> 0;
            this._h[(i % 8) * 2 + 1] = (this._h[(i % 8) * 2 + 1] ^ v[i * 2 + 1]) >>> 0;
        }
        for (i = 0; i < 8; i += 1) {
            this._h[i * 2] = (this._h[i * 2] ^ this._s[(i % 4) * 2]) >>> 0;
            this._h[i * 2 + 1] = (this._h[i * 2 + 1] ^ this._s[(i % 4) * 2 + 1]) >>> 0;
        }
    }
    /**
     * Adds padding to the message as per the Blake-512 specification, ensuring
     * the message length is a multiple of the block size.
     */
    _padding() {
        const len = this._length.slice();
        len[0] += this._blockOffset * 8;
        lengthCarry(len);
        const msglen = Buffer.alloc(16);
        for (let i = 0; i < 4; i += 1)
            msglen.writeUInt32BE(len[3 - i], i * 4);
        if (this._blockOffset === 111) {
            this._length[0] -= 8;
            this.update(this._oo);
        }
        else {
            if (this._blockOffset < 111) {
                if (this._blockOffset === 0)
                    this._nullt = true;
                this._length[0] -= (111 - this._blockOffset) * 8;
                this.update(padding.subarray(0, 111 - this._blockOffset));
            }
            else {
                this._length[0] -= (128 - this._blockOffset) * 8;
                this.update(padding.subarray(0, 128 - this._blockOffset));
                this._length[0] -= 111 * 8;
                this.update(padding.subarray(1, 1 + 111));
                this._nullt = true;
            }
            this.update(this._zo);
            this._length[0] -= 8;
        }
        this._length[0] -= 128;
        this.update(msglen);
    }
    /**
     * Completes the hash computation and returns the final hash value.
     * This method applies the necessary padding, performs the final compression,
     * and returns the hash output.
     * @returns The Blake-512 hash of the input data.
     */
    digest() {
        this._padding();
        const buffer = Buffer.alloc(64);
        for (let i = 0; i < 16; i += 1)
            buffer.writeUInt32BE(this._h[i], i * 4);
        return buffer;
    }
    /**
     * Updates the hash with new data. This method can be called multiple
     * times to incrementally add data to the hash computation.
     * @param data The data to add to the hash.
     * @returns This instance, to allow method chaining.
     */
    update(data) {
        const block = this._block;
        let offset = 0;
        while (this._blockOffset + data.length - offset >= block.length) {
            for (let i = this._blockOffset; i < block.length;)
                /* eslint-disable no-plusplus */
                block[i++] = data[offset++];
            this._length[0] += block.length * 8;
            lengthCarry(this._length);
            this._compress();
            this._blockOffset = 0;
        }
        while (offset < data.length)
            /* eslint-disable no-plusplus */
            block[this._blockOffset++] = data[offset++];
        return this;
    }
}

/**
 * Prunes a buffer to meet the specific requirements for using it as a private key
 * or part of a signature.
 * @param buff The buffer to be pruned.
 * @returns The pruned buffer.
 */
function pruneBuffer(buff) {
    buff[0] &= 0xf8;
    buff[31] &= 0x7f;
    buff[31] |= 0x40;
    return buff;
}
/**
 * Validates if the given object is a valid point on the Baby Jubjub elliptic curve.
 * @param point The point to validate.
 * @returns True if the object is a valid point, false otherwise.
 */
function isPoint(point) {
    return isArray(point) && point.length === 2 && isBigNumber(point[0]) && isBigNumber(point[1]);
}
/**
 * Checks if the provided object conforms to the expected format of a Signature.
 * @param signature The signature to validate.
 * @returns True if the object is a valid Signature, false otherwise.
 */
function isSignature(signature) {
    return (isObject(signature) &&
        Object.prototype.hasOwnProperty.call(signature, "R8") &&
        Object.prototype.hasOwnProperty.call(signature, "S") &&
        isPoint(signature.R8) &&
        isBigNumber(signature.S));
}
/**
 * Validates and converts a BigNumberish private key to a Buffer.
 * @param privateKey The private key to check and convert.
 * @returns The private key as a Buffer.
 */
function checkPrivateKey(privateKey) {
    requireTypes(privateKey, "privateKey", ["Buffer", "Uint8Array", "string"]);
    return Buffer.from(privateKey);
}
/**
 * Validates and converts a BigNumberish message to a bigint.
 * @param message The message to check and convert.
 * @returns The message as a bigint.
 */
function checkMessage(message) {
    requireTypes(message, "message", ["bignumberish", "string"]);
    if (isBigNumberish(message)) {
        return bigNumberishToBigInt(message);
    }
    return bufferToBigInt(Buffer.from(message));
}
/**
 * Computes the Blake512 hash of the input message.
 * Blake512 is a cryptographic hash function that produces a hash value of 512 bits,
 * commonly used for data integrity checks and other cryptographic applications.
 * @param message The input data to hash, provided as a Buffer.
 * @returns A Buffer containing the 512-bit hash result.
 */
function hash(message) {
    const engine = new Blake512();
    engine.update(Buffer.from(message));
    return engine.digest();
}

/**
 * Derives a secret scalar from a given EdDSA private key.
 *
 * This process involves hashing the private key with Blake1, pruning the resulting hash to retain the lower 32 bytes,
 * and converting it into a little-endian integer. The use of the secret scalar streamlines the public key generation
 * process by omitting steps 1, 2, and 3 as outlined in RFC 8032 section 5.1.5, enhancing circuit efficiency and simplicity.
 * This method is crucial for fixed-base scalar multiplication operations within the correspondent cryptographic circuit.
 * For detailed steps, see: {@link https://datatracker.ietf.org/doc/html/rfc8032#section-5.1.5}.
 * For example usage in a circuit, see: {@link https://github.com/semaphore-protocol/semaphore/blob/2c144fc9e55b30ad09474aeafa763c4115338409/packages/circuits/semaphore.circom#L21}
 *
 * The private key must be an instance of Buffer, Uint8Array or a string. The input will be used to
 * generate entropy and there is no limit in size.
 * The string is used as a set of raw bytes (in UTF-8) and is typically used to pass passwords or secret messages.
 * If you want to pass a bigint, a number or a hexadecimal, be sure to convert them to one of the supported types first.
 * The 'conversions' module in @zk-kit/utils provides a set of functions that may be useful in case you need to convert types.
 *
 * @param privateKey The EdDSA private key for generating the associated public key.
 * @returns The derived secret scalar to be used to calculate public key and optimized for circuit calculations.
 */
function deriveSecretScalar(privateKey) {
    // Convert the private key to buffer.
    privateKey = checkPrivateKey(privateKey);
    let hash$1 = hash(privateKey);
    hash$1 = hash$1.slice(0, 32);
    hash$1 = pruneBuffer(hash$1);
    return scalar.shiftRight(leBufferToBigInt(hash$1), BigInt(3)) % subOrder;
}
/**
 * Derives a public key from a given private key using the
 * {@link https://eips.ethereum.org/EIPS/eip-2494|Baby Jubjub} elliptic curve.
 * This function utilizes the Baby Jubjub elliptic curve for cryptographic operations.
 * The private key should be securely stored and managed, and it should never be exposed
 * or transmitted in an unsecured manner.
 *
 * The private key must be an instance of Buffer, Uint8Array or a string. The input will be used to
 * generate entropy and there is no limit in size.
 * The string is used as a set of raw bytes (in UTF-8) and is typically used to pass passwords or secret messages.
 * If you want to pass a bigint, a number or a hexadecimal, be sure to convert them to one of the supported types first.
 * The 'conversions' module in @zk-kit/utils provides a set of functions that may be useful in case you need to convert types.
 *
 * @param privateKey The private key used for generating the public key.
 * @returns The derived public key.
 */
function derivePublicKey(privateKey) {
    const s = deriveSecretScalar(privateKey);
    return mulPointEscalar(Base8, s);
}
/**
 * Signs a message using the provided private key, employing Poseidon hashing and
 * EdDSA with the Baby Jubjub elliptic curve.
 *
 * The private key must be an instance of Buffer, Uint8Array or a string. The input will be used to
 * generate entropy and there is no limit in size.
 * The string is used as a set of raw bytes (in UTF-8) and is typically used to pass passwords or secret messages.
 * If you want to pass a bigint, a number or a hexadecimal, be sure to convert them to one of the supported types first.
 * The 'conversions' module in @zk-kit/utils provides a set of functions that may be useful in case you need to convert types.
 *
 * @param privateKey The private key used to sign the message.
 * @param message The message to be signed.
 * @returns The signature object, containing properties relevant to EdDSA signatures, such as 'R8' and 'S' values.
 */
function signMessage(privateKey, message) {
    // Convert the private key to buffer.
    privateKey = checkPrivateKey(privateKey);
    // Convert the message to big integer.
    message = checkMessage(message);
    const hash$1 = hash(privateKey);
    const sBuff = pruneBuffer(hash$1.slice(0, 32));
    const s = leBufferToBigInt(sBuff);
    const A = mulPointEscalar(Base8, scalar.shiftRight(s, BigInt(3)));
    const msgBuff = leBigIntToBuffer(message, 32);
    const rBuff = hash(Buffer.concat([hash$1.slice(32, 64), msgBuff]));
    const Fr = new F1Field(subOrder);
    const r = Fr.e(leBufferToBigInt(rBuff));
    const R8 = mulPointEscalar(Base8, r);
    const hm = poseidon5_2([R8[0], R8[1], A[0], A[1], message]);
    const S = Fr.add(r, Fr.mul(hm, s));
    return { R8, S };
}
/**
 * Verifies an EdDSA signature using the Baby Jubjub elliptic curve and Poseidon hash function.
 * @param message The original message that was be signed.
 * @param signature The EdDSA signature to be verified.
 * @param publicKey The public key associated with the private key used to sign the message.
 * @returns Returns true if the signature is valid and corresponds to the message and public key, false otherwise.
 */
function verifySignature(message, signature, publicKey) {
    if (!isPoint(publicKey) ||
        !isSignature(signature) ||
        !inCurve(signature.R8) ||
        !inCurve(publicKey) ||
        BigInt(signature.S) >= subOrder) {
        return false;
    }
    // Convert the message to big integer.
    message = checkMessage(message);
    // Convert the signature values to big integers for calculations.
    const _signature = {
        R8: [BigInt(signature.R8[0]), BigInt(signature.R8[1])],
        S: BigInt(signature.S)
    };
    // Convert the public key values to big integers for calculations.
    const _publicKey = [BigInt(publicKey[0]), BigInt(publicKey[1])];
    const hm = poseidon5_2([signature.R8[0], signature.R8[1], publicKey[0], publicKey[1], message]);
    const pLeft = mulPointEscalar(Base8, BigInt(signature.S));
    let pRight = mulPointEscalar(_publicKey, scalar.mul(hm, BigInt(8)));
    pRight = addPoint(_signature.R8, pRight);
    // Return true if the points match.
    return Fr.eq(pLeft[0], pRight[0]) && Fr.eq(pLeft[1], pRight[1]);
}
/**
 * Converts a given public key into a packed (compressed) string format for efficient transmission and storage.
 * This method ensures the public key is valid and within the Baby Jubjub curve before packing.
 * @param publicKey The public key to be packed.
 * @returns A string representation of the packed public key.
 */
function packPublicKey(publicKey) {
    if (!isPoint(publicKey) || !inCurve(publicKey)) {
        throw new Error("Invalid public key");
    }
    // Convert the public key values to big integers for calculations.
    const _publicKey = [BigInt(publicKey[0]), BigInt(publicKey[1])];
    return packPoint(_publicKey);
}
/**
 * Unpacks a public key from its packed string representation back to its original point form on the Baby Jubjub curve.
 * This function checks for the validity of the input format before attempting to unpack.
 * @param publicKey The packed public key as a bignumberish.
 * @returns The unpacked public key as a point.
 */
function unpackPublicKey(publicKey) {
    requireBigNumberish(publicKey, "publicKey");
    const unpackedPublicKey = unpackPoint(bigNumberishToBigInt(publicKey));
    if (unpackedPublicKey === null) {
        throw new Error("Invalid public key");
    }
    return unpackedPublicKey;
}
/**
 * Packs an EdDSA signature into a buffer of 64 bytes for efficient storage.
 * Use {@link unpackSignature} to reverse the process without needing to know
 * the details of the format.
 *
 * The buffer contains the R8 point packed int 32 bytes (via
 * {@link packSignature}) followed by the S scalar.  All encodings are
 * little-endian.
 *
 * @param signature the signature to pack
 * @returns a 64 byte buffer containing the packed signature
 */
function packSignature(signature) {
    if (!isSignature(signature) || !inCurve(signature.R8) || BigInt(signature.S) >= subOrder) {
        throw new Error("Invalid signature");
    }
    const numericSignature = {
        R8: signature.R8.map((c) => BigInt(c)),
        S: BigInt(signature.S)
    };
    const packedR8 = packPoint(numericSignature.R8);
    const packedBytes = Buffer.alloc(64);
    packedBytes.set(leBigIntToBuffer(packedR8, 32), 0);
    packedBytes.set(leBigIntToBuffer(numericSignature.S, 32), 32);
    return packedBytes;
}
/**
 * Unpacks a signature produced by {@link packSignature}.  See that function
 * for the details of the format.
 *
 * @param packedSignature the 64 byte buffer to unpack
 * @returns a Signature with numbers in string form
 */
function unpackSignature(packedSignature) {
    requireBuffer(packedSignature, "packedSignature");
    if (packedSignature.length !== 64) {
        throw new Error("Packed signature must be 64 bytes");
    }
    const sliceR8 = packedSignature.subarray(0, 32);
    const sliceS = packedSignature.subarray(32, 64);
    const unpackedR8 = unpackPoint(leBufferToBigInt(sliceR8));
    if (unpackedR8 === null) {
        throw new Error(`Invalid packed signature point ${sliceS.toString("hex")}.`);
    }
    return {
        R8: unpackedR8,
        S: leBufferToBigInt(sliceS)
    };
}
/**
 * Represents a cryptographic entity capable of signing messages and verifying signatures
 * using the EdDSA scheme with Poseidon hash and the Baby Jubjub elliptic curve.
 */
class EdDSAPoseidon {
    /**
     * Initializes a new instance, deriving necessary cryptographic parameters from the provided private key.
     * If the private key is not passed as a parameter, a random 32-byte hexadecimal key is generated.
     *
     * The private key must be an instance of Buffer, Uint8Array or a string. The input will be used to
     * generate entropy and there is no limit in size.
     * The string is used as a set of raw bytes (in UTF-8) and is typically used to pass passwords or secret messages.
     * If you want to pass a bigint, a number or a hexadecimal, be sure to convert them to one of the supported types first.
     * The 'conversions' module in @zk-kit/utils provides a set of functions that may be useful in case you need to convert types.
     *
     * @param privateKey The private key used for signing and public key derivation.
     */
    constructor(privateKey = crypto.getRandomValues(32)) {
        this.privateKey = privateKey;
        this.secretScalar = deriveSecretScalar(privateKey);
        this.publicKey = derivePublicKey(privateKey);
        this.packedPublicKey = packPublicKey(this.publicKey);
    }
    /**
     * Signs a given message using the private key and returns the signature.
     * @param message The message to be signed.
     * @returns The signature of the message.
     */
    signMessage(message) {
        return signMessage(this.privateKey, message);
    }
    /**
     * Verifies a signature against a message and the public key stored in this instance.
     * @param message The message whose signature is to be verified.
     * @param signature The signature to be verified.
     * @returns True if the signature is valid for the message and public key, false otherwise.
     */
    verifySignature(message, signature) {
        return verifySignature(message, signature, this.publicKey);
    }
}

export { EdDSAPoseidon, derivePublicKey, deriveSecretScalar, packPublicKey, packSignature, signMessage, unpackPublicKey, unpackSignature, verifySignature };
