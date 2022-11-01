/*
The MIT License (MIT)

Copyright (c) 2014 Call-Em-All
Copyright (c) 2022 ViperTech & CryptoRed

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

var fun = function(image_data, scale) {

    return new Promise(function(resolve, reject){

        "use strict";
        var redMask = 0xff0000
        var greenMask = 0x00ff00
        var blueMask = 0x0000ff

        function blendComponent (mask, n, m, inPixel, setPixel) {
            var inChan = inPixel & mask
            var setChan = setPixel & mask
            var blend = setChan * n + inChan * (m - n)
            return mask & (blend / m)
        }

        function alphaBlend (n, m, dstPtr, col) {
            // assert n < 256 : "possible overflow of (col & redMask) * N";
            // assert m < 256 : "possible overflow of (col & redMask) * N + (dst & redMask) * (M - N)";
            // assert 0 < n && n < m : "0 < N && N < M";

            var dst = dstPtr.get()
            var redComponent = blendComponent(redMask, n, m, dst, col)
            var greenComponent = blendComponent(greenMask, n, m, dst, col)
            var blueComponent = blendComponent(blueMask, n, m, dst, col)
            var blend = (redComponent | greenComponent | blueComponent)
            dstPtr.set(blend | 0xff000000)
        }


        class Scaler2x {
            constructor () {
                this.scale = 2
            }

            scale () {
                return this.scale
            }

            blendLineShallow (col, out) {
                alphaBlend(1, 4, out.ref(this.scale - 1, 0), col)
                alphaBlend(3, 4, out.ref(this.scale - 1, 1), col)
            }

            blendLineSteep (col, out) {
                alphaBlend(1, 4, out.ref(0, this.scale - 1), col)
                alphaBlend(3, 4, out.ref(1, this.scale - 1), col)
            }

            blendLineSteepAndShallow (col, out) {
                alphaBlend(1, 4, out.ref(1, 0), col)
                alphaBlend(1, 4, out.ref(0, 1), col)
                alphaBlend(5, 6, out.ref(1, 1), col)
            }

            blendLineDiagonal (col, out) {
                alphaBlend(1, 2, out.ref(1, 1), col)
            }

            blendCorner (col, out) {
                alphaBlend(21, 100, out.ref(1, 1), col)
            }
        }


        class Scaler3x extends Scaler2x{
            constructor () {
                super()
                this.scale = 3
            }

            blendLineShallow (col, out) {
                super.blendLineShallow(col, out)
                // alphaBlend(1, 4, out.ref(this.scale - 1, 0), col)
                alphaBlend(1, 4, out.ref(this.scale - 2, 2), col)

                // alphaBlend(3, 4, out.ref(this.scale - 1, 1), col)

                out.ref(this.scale - 1, 2).set(col)
            }

            blendLineSteep (col, out) {
                super.blendLineSteep(col, out)
                // alphaBlend(1, 4, out.ref(0, this.scale - 1), col)
                alphaBlend(1, 4, out.ref(2, this.scale - 2), col)

                // alphaBlend(3, 4, out.ref(1, this.scale - 1), col)

                out.ref(2, this.scale - 1).set(col)
            }

            blendLineSteepAndShallow (col, out) {
                alphaBlend(1, 4, out.ref(2, 0), col)
                alphaBlend(1, 4, out.ref(0, 2), col)

                alphaBlend(3, 4, out.ref(2, 1), col)
                alphaBlend(3, 4, out.ref(1, 2), col)

                out.ref(2, 2).set(col)
            }

            blendLineDiagonal (col, out) {
                alphaBlend(1, 8, out.ref(1, 2), col)
                alphaBlend(1, 8, out.ref(2, 1), col)
                alphaBlend(7, 8, out.ref(2, 2), col)
            }

            blendCorner (col, out) {
                alphaBlend(45, 100, out.ref(2, 2), col)
            }
        }


        class Scaler4x extends Scaler3x {
            constructor () {
                super()
                this.scale = 4
            }

            blendLineShallow (col, out) {
                super.blendLineShallow(col, out)
                // alphaBlend(1, 4, out.ref(this.scale - 1, 0), col)
                // alphaBlend(1, 4, out.ref(this.scale - 2, 2), col)

                // alphaBlend(3, 4, out.ref(this.scale - 1, 1), col)
                alphaBlend(3, 4, out.ref(this.scale - 2, 3), col)

                // out.ref(this.scale - 1, 2).set(col)
                out.ref(this.scale - 1, 3).set(col)
            }

            blendLineSteep (col, out) {
                super.blendLineSteep(col, out)
                // alphaBlend(1, 4, out.ref(0, this.scale - 1), col)
                // alphaBlend(1, 4, out.ref(2, this.scale - 2), col)

                // alphaBlend(3, 4, out.ref(1, this.scale - 1), col)
                alphaBlend(3, 4, out.ref(3, this.scale - 2), col)

                // out.ref(2, this.scale - 1).set(col)
                out.ref(3, this.scale - 1).set(col)
            }

            blendLineSteepAndShallow (col, out) {
                alphaBlend(3, 4, out.ref(3, 1), col)
                alphaBlend(3, 4, out.ref(1, 3), col)
                alphaBlend(1, 4, out.ref(3, 0), col)
                alphaBlend(1, 4, out.ref(0, 3), col)

                alphaBlend(1, 3, out.ref(2, 2), col)

                out.ref(3, 3).set(col)
                out.ref(3, 2).set(col)
                out.ref(2, 3).set(col)
            }

            blendLineDiagonal (col, out) {
                alphaBlend(1, 2, out.ref(this.scale - 1, this.scale / 2), col)
                alphaBlend(1, 2, out.ref(this.scale - 2, this.scale / 2 + 1), col)
                out.ref(this.scale - 1, this.scale - 1).set(col)
            }

            blendCorner (col, out) {
                alphaBlend(68, 100, out.ref(3, 3), col)
                alphaBlend(9, 100, out.ref(3, 2), col)
                alphaBlend(9, 100, out.ref(2, 3), col)
            }
        }

        class Scaler5x extends Scaler4x{
            constructor () {
                super()
                this.scale = 5
            }

            blendLineShallow (col, out) {
                super.blendLineShallow(col, out)
                // **
                // alphaBlend(1, 4, out.ref(this.scale - 1, 0), col)
                // alphaBlend(1, 4, out.ref(this.scale - 2, 2), col)
                alphaBlend(1, 4, out.ref(this.scale - 3, 4), col)
                // alphaBlend(3, 4, out.ref(this.scale - 1, 1), col)
                // alphaBlend(3, 4, out.ref(this.scale - 2, 3), col)
                // out.ref(this.scale - 1, 2).set(col)
                // out.ref(this.scale - 1, 3).set(col)
                out.ref(this.scale - 1, 4).set(col)
                out.ref(this.scale - 2, 4).set(col)
            }

            blendLineSteep (col, out) {
                super.blendLineSteep(col, out)
                // alphaBlend(1, 4, out.ref(0, this.scale - 1), col)
                // alphaBlend(1, 4, out.ref(2, this.scale - 2), col)
                alphaBlend(1, 4, out.ref(4, this.scale - 3), col)
                // alphaBlend(3, 4, out.ref(1, this.scale - 1), col)
                alphaBlend(3, 4, out.ref(3, this.scale - 2), col)
                // out.ref(2, this.scale - 1).set(col)
                // out.ref(3, this.scale - 1).set(col)
                out.ref(4, this.scale - 1).set(col)
                out.ref(4, this.scale - 2).set(col)
            }

            blendLineSteepAndShallow (col, out) {
                alphaBlend(1, 4, out.ref(0, this.scale - 1), col)
                alphaBlend(1, 4, out.ref(2, this.scale - 2), col)
                alphaBlend(3, 4, out.ref(1, this.scale - 1), col)

                alphaBlend(1, 4, out.ref(this.scale - 1, 0), col)
                alphaBlend(1, 4, out.ref(this.scale - 2, 2), col)
                alphaBlend(3, 4, out.ref(this.scale - 1, 1), col)
                alphaBlend(2, 3, out.ref(3, 3), col)

                out.ref(2, this.scale - 1).set(col)
                out.ref(3, this.scale - 1).set(col)
                out.ref(4, this.scale - 1).set(col)

                out.ref(this.scale - 1, 2).set(col)
                out.ref(this.scale - 1, 3).set(col)
            }

            blendLineDiagonal (col, out) {
                // **
                alphaBlend(1, 8, out.ref(this.scale - 1, this.scale / 2), col)
                alphaBlend(1, 8, out.ref(this.scale - 2, this.scale / 2 + 1), col)
                alphaBlend(1, 8, out.ref(this.scale - 3, this.scale / 2 + 2), col)
                alphaBlend(7, 8, out.ref(4, 3), col)
                alphaBlend(7, 8, out.ref(3, 4), col)
                out.ref(4, 4).set(col)
            }

            blendCorner (col, out) {
                alphaBlend(86, 100, out.ref(4, 4), col)
                alphaBlend(23, 100, out.ref(4, 3), col)
                alphaBlend(23, 100, out.ref(3, 4), col)
            }
        }

        class Scaler6x extends Scaler5x {
            constructor () {
                super()
                this.scale = 6
            }

            blendLineShallow (col, out) {
                super.blendLineShallow(col, out)
                // alphaBlend(1, 4, out.ref(this.scale - 1, 0), col)
                // alphaBlend(1, 4, out.ref(this.scale - 2, 2), col)
                // alphaBlend(1, 4, out.ref(this.scale - 3, 4), col)

                // alphaBlend(3, 4, out.ref(this.scale - 1, 1), col)
                // alphaBlend(3, 4, out.ref(this.scale - 2, 3), col)
                alphaBlend(3, 4, out.ref(this.scale - 3, 5), col)

                // out.ref(this.scale - 1, 2).set(col)
                // out.ref(this.scale - 1, 3).set(col)
                // out.ref(this.scale - 1, 4).set(col)
                out.ref(this.scale - 1, 5).set(col)

                // out.ref(this.scale - 2, 4).set(col)
                out.ref(this.scale - 2, 5).set(col)
            }

            blendLineSteep (col, out) {
                super.blendLineSteep(col, out)
                // alphaBlend(1, 4, out.ref(0, this.scale - 1), col)
                // alphaBlend(1, 4, out.ref(2, this.scale - 2), col)
                // alphaBlend(1, 4, out.ref(4, this.scale - 3), col)

                // alphaBlend(3, 4, out.ref(1, this.scale - 1), col)
                // alphaBlend(3, 4, out.ref(3, this.scale - 2), col)
                alphaBlend(3, 4, out.ref(5, this.scale - 3), col)

                // out.ref(2, this.scale - 1).set(col)
                // out.ref(3, this.scale - 1).set(col)
                // out.ref(4, this.scale - 1).set(col)
                out.ref(5, this.scale - 1).set(col)

                // out.ref(4, this.scale - 2).set(col)
                out.ref(5, this.scale - 2).set(col)
            }

            blendLineSteepAndShallow (col, out) {
                alphaBlend(1, 4, out.ref(0, this.scale - 1), col)
                alphaBlend(1, 4, out.ref(2, this.scale - 2), col)
                alphaBlend(3, 4, out.ref(1, this.scale - 1), col)
                alphaBlend(3, 4, out.ref(3, this.scale - 2), col)

                alphaBlend(1, 4, out.ref(this.scale - 1, 0), col)
                alphaBlend(1, 4, out.ref(this.scale - 2, 2), col)
                alphaBlend(3, 4, out.ref(this.scale - 1, 1), col)
                alphaBlend(3, 4, out.ref(this.scale - 2, 3), col)

                out.ref(2, this.scale - 1).set(col)
                out.ref(3, this.scale - 1).set(col)
                out.ref(4, this.scale - 1).set(col)
                out.ref(5, this.scale - 1).set(col)

                out.ref(4, this.scale - 2).set(col)
                out.ref(5, this.scale - 2).set(col)

                out.ref(this.scale - 1, 2).set(col)
                out.ref(this.scale - 1, 3).set(col)
            }

            blendLineDiagonal (col, out) {
                alphaBlend(1, 2, out.ref(this.scale - 1, this.scale / 2), col)
                alphaBlend(1, 2, out.ref(this.scale - 2, this.scale / 2 + 1), col)
                alphaBlend(1, 2, out.ref(this.scale - 3, this.scale / 2 + 2), col)

                out.ref(this.scale - 2, this.scale - 1).set(col)
                out.ref(this.scale - 1, this.scale - 1).set(col)
                out.ref(this.scale - 1, this.scale - 2).set(col)
            }

            blendCorner (col, out) {
                alphaBlend(97, 100, out.ref(5, 5), col)
                alphaBlend(42, 100, out.ref(4, 5), col)
                alphaBlend(42, 100, out.ref(5, 4), col)
                alphaBlend(6, 100, out.ref(5, 3), col)
                alphaBlend(6, 100, out.ref(3, 5), col)
            }
        }


        class IntPtr {
            constructor (intArray) {
                this.arr = intArray
                this.ptr = 0
            }

            position (pos) {
                this.ptr = pos
            }

            get () {
                return this.arr[this.ptr]
            }

            set (val) {
                this.arr[this.ptr] = val
            }
        }

        class BlendResult {
            constructor () {
                this.f = 0
                this.g = 0
                this.j = 0
                this.k = 0
            }

            reset () {
                this.f = 0
                this.g = 0
                this.j = 0
                this.k = 0
            }
        }

        var maxRots = 4
        var maxScale = 6
        var maxScaleSq = maxScale * maxScale

        class OutputMatrix {
            constructor (scale, out, outWidth) {
                this.out = new IntPtr(out)
                this.n = (scale - 2) * (maxRots * maxScaleSq)
                this.outWidth = outWidth
                this.outi = 0
                this.nr = 0
            }

            move (rotDeg, outi) {
                this.nr = this.n + rotDeg * maxScaleSq
                this.outi = outi
            }

            ref (i, j) {
                i = parseInt(i)
                j = parseInt(j)
                var rot = matrixRotation[this.nr + i * maxScale + j]
                this.out.position(this.outi + rot.J + rot.I * this.outWidth)
                return this.out
            }
        }

        var Rot = (function () {
            // |0|6|8|2|1|3|
            // |7|5|2|0|6|8|
            // |3|8|5|1|4|4|
            // |4|4|5|1|3|7|
            // |6|8|2|0|7|5|
            // |1|3|8|2|0|7|
            var arr = []
            var
                a = 0, b = 1, c = 2,
                d = 3, e = 4, f = 5,
                g = 6, h = 7, i = 8

            var deg0 = [
                a, b, c,
                d, e, f,
                g, h, i
            ]

            var deg90 = [
                g, d, a,
                h, e, b,
                i, f, c
            ]

            var deg180 = [
                i, h, g,
                f, e, d,
                c, b, a
            ]

            var deg270 = [
                c, f, i,
                b, e, h,
                a, d, g
            ]

            var rotation = [
                deg0, deg90, deg180, deg270
            ]

            for (var rotDeg = 0; rotDeg < 4; rotDeg++) {
                for (var x = 0; x < 9; x++) {
                    arr[(x << 2) + rotDeg] = rotation[rotDeg][x]
                }
            }
            return arr
        })()

        var BlendType = {
            'BLEND_NONE': 0,
            'BLEND_NORMAL': 1,
            'BLEND_DOMINANT': 2
        }

        var blendResult = new BlendResult()

        function square (value) {
            return value * value
        }

        // 用指定颜色填充区块
        function fillBlock (trg, trgi, pitch, col, blockSize) {
            for (var y = 0; y < blockSize; ++y, trgi += pitch) {
                for (var x = 0; x < blockSize; ++x) {
                    trg[trgi + x] = col
                }
            }
        }

        function distYCbCr (pix1, pix2, lumaWeight) {
            var r_diff = ((pix1 & redMask) - (pix2 & redMask)) >> 16
            var g_diff = ((pix1 & greenMask) - (pix2 & greenMask)) >> 8
            var b_diff = ((pix1 & blueMask) - (pix2 & blueMask))

            var k_b = 0.0722, k_r = 0.2126, k_g = 1 - k_b - k_r
            var scale_b = 0.5 / (1 - k_b), scale_r = 0.5 / (1 - k_r)

            var y = k_r * r_diff + k_g * g_diff + k_b * b_diff
            var c_b = scale_b * (b_diff - y)
            var c_r = scale_r * (r_diff - y)
            return square(lumaWeight * y) + square(c_b) + square(c_r)
        }

        function colorDist (pix1, pix2, luminanceWeight) {
            if (pix1 === pix2) {
                return 0
            }
            return distYCbCr(pix1, pix2, luminanceWeight)
        }

        var config = {
            dominantDirectionThreshold: 3.6,
            luminanceWeight: 1.0,
            equalColorTolerance: 30.0,
            steepDirectionThreshold: 2.2
        }

        function preProcessCorners_colorDist_ (col1, col2) {
            col1 = col1 & 0xffffffff
            col2 = col2 & 0xffffffff
            return colorDist(col1, col2, config.luminanceWeight)
        }

        var eqColorThres = square(config.equalColorTolerance)

        function scalePixel_colorEq_ (col1, col2) {
            return colorDist(col1, col2, config.luminanceWeight) < eqColorThres
        }

        function scalePixel_colorDist_ (col1, col2) {
            return colorDist(col1, col2, config.luminanceWeight)
        }

        function buildMatrixRotation (rotDeg, I, J, N) {
            var I_old = 0, J_old = 0
            if (rotDeg === 0) {
                I_old = I
                J_old = J
            } else {
                var old = buildMatrixRotation(rotDeg - 1, I, J, N)
                I_old = N - 1 - old.J
                J_old = old.I
            }
            return { I: I_old, J: J_old }
        }

        var matrixRotation = (function () {
            var matrixRotation = []
            for (var n = 2; n < maxScale + 1; n++) {
                for (var r = 0; r < maxRots; r++) {
                    var nr = (n - 2) * (maxRots * maxScaleSq) + r * maxScaleSq
                    for (var i = 0; i < maxScale; i++) {
                        for (var j = 0; j < maxScale; j++) {
                            matrixRotation[nr + i * maxScale + j] = buildMatrixRotation(r, i, j, n)
                        }
                    }
                }
            }
            return matrixRotation
        })()

        function preProcessCorners (ker4x4) {
            blendResult.reset()
            if ((ker4x4.f === ker4x4.g && ker4x4.j === ker4x4.k) ||
                (ker4x4.f === ker4x4.j && ker4x4.g === ker4x4.k)) {
                return
            }

            var dist = preProcessCorners_colorDist_

            var weight = 4
            var jg =
                dist(ker4x4.i, ker4x4.f) +
                dist(ker4x4.f, ker4x4.c) +
                dist(ker4x4.n, ker4x4.k) +
                dist(ker4x4.k, ker4x4.h) +
                weight * dist(ker4x4.j, ker4x4.g)
            var fk =
                dist(ker4x4.e, ker4x4.j) +
                dist(ker4x4.j, ker4x4.o) +
                dist(ker4x4.b, ker4x4.g) +
                dist(ker4x4.g, ker4x4.l) +
                weight * dist(ker4x4.f, ker4x4.k)

            var dominantGradient = config.dominantDirectionThreshold * jg < fk
            if (jg < fk) {
                if (ker4x4.f !== ker4x4.g && ker4x4.f !== ker4x4.j) {
                    blendResult.f = dominantGradient ? BlendType.BLEND_DOMINANT : BlendType.BLEND_NORMAL
                }
                if (ker4x4.k !== ker4x4.g && ker4x4.k !== ker4x4.j) {
                    blendResult.k = dominantGradient ? BlendType.BLEND_DOMINANT : BlendType.BLEND_NORMAL
                }
            } else if (fk < jg) {
                if (ker4x4.j !== ker4x4.f && ker4x4.j !== ker4x4.k) {
                    blendResult.j = dominantGradient ? BlendType.BLEND_DOMINANT : BlendType.BLEND_NORMAL
                }
                if (ker4x4.g !== ker4x4.f && ker4x4.g !== ker4x4.k) {
                    blendResult.g = dominantGradient ? BlendType.BLEND_DOMINANT : BlendType.BLEND_NORMAL
                }
            }
        }

        var BlendInfo = {
            getTopL (b) {
                return (b & 0x3) & 0xff
            },
            getTopR (b) {
                return ((b >> 2) & 0x3) & 0xff
            },
            getBottomR (b) {
                return ((b >> 4) & 0x3) & 0xff
            },
            getBottomL (b) {
                return ((b >> 6) & 0x3) & 0xff
            },
            setTopL (b, bt) {
                return (b | bt) & 0xff
            },
            setTopR (b, bt) {
                return (b | bt << 2) & 0xff
            },
            setBottomR (b, bt) {
                return (b | bt << 4) & 0xff
            },
            setBottomL (b, bt) {
                return (b | (bt << 6)) & 0xff
            },
            rotate (b, rotDeg) {
                // assert rotDeg >= 0 && rotDeg < 4 : "RotationDegree enum does not have type: " + rotDeg;
                var l = rotDeg << 1
                var r = 8 - l
                return (b << l | b >> r) & 0xff
            }
        }

        var outputMatrix

        function scalePixel (scaler, rotDeg, ker3x3, trg, trgi, trgWidth, blendInfo) {
            var b = ker3x3[Rot[(1 << 2) + rotDeg]]
            var c = ker3x3[Rot[(2 << 2) + rotDeg]]
            var d = ker3x3[Rot[(3 << 2) + rotDeg]]
            var e = ker3x3[Rot[(4 << 2) + rotDeg]]
            var f = ker3x3[Rot[(5 << 2) + rotDeg]]
            var g = ker3x3[Rot[(6 << 2) + rotDeg]]
            var h = ker3x3[Rot[(7 << 2) + rotDeg]]
            var i = ker3x3[Rot[(8 << 2) + rotDeg]]

            var blend = BlendInfo.rotate(blendInfo, rotDeg)
            if (BlendInfo.getBottomR(blend) === BlendType.BLEND_NONE) {
                return
            }

            var eq = scalePixel_colorEq_
            var dist = scalePixel_colorDist_

            var doLineBlend

            if (BlendInfo.getBottomR(blend) >= BlendType.BLEND_DOMINANT) {
                doLineBlend = true
            } else if (BlendInfo.getTopR(blend) !== BlendType.BLEND_NONE && !eq(e, g)) {
                doLineBlend = false
            } else if (BlendInfo.getBottomL(blend) !== BlendType.BLEND_NONE && !eq(e, c)) {
                doLineBlend = false
            } else {
                doLineBlend = !(eq(g, h) && eq(h, i) && eq(i, f) && eq(f, c) && !eq(e, i))
            }

            var px = dist(e, f) <= dist(e, h) ? f : h

            var out = outputMatrix
            out.move(rotDeg, trgi)

            if (!doLineBlend) {
                scaler.blendCorner(px, out)
                return
            }

            var fg = dist(f, g)
            var hc = dist(h, c)

            var haveShallowLine = config.steepDirectionThreshold * fg <= hc && e !== g && d !== g
            var haveSteepLine = config.steepDirectionThreshold * hc <= fg && e !== c && b !== c

            if (haveShallowLine) {
                if (haveSteepLine) {
                    scaler.blendLineSteepAndShallow(px, out)
                } else {
                    scaler.blendLineShallow(px, out)
                }
            } else {
                if (haveSteepLine) {
                    scaler.blendLineSteep(px, out)
                } else {
                    scaler.blendLineDiagonal(px, out)
                }
            }
        }

        function scaleImage (scaleSize, src, trg, srcWidth, srcHeight, yFirst, yLast) {
            yFirst = Math.max(yFirst, 0)
            yLast = Math.min(yLast, srcHeight)

            if (yFirst >= yLast || srcWidth <= 0) {
                return
            }

            var trgWidth = srcWidth * scaleSize

            var preProcBuffer = []
            var ker4 = {
                a: 0, b: 0, c: 0, d: 0,
                e: 0, f: 0, g: 0, h: 0,
                i: 0, j: 0, k: 0, l: 0,
                m: 0, n: 0, o: 0, p: 0,
            }

            if (yFirst > 0) {
                var y = yFirst - 1
                var s_m1 = srcWidth * Math.max(y - 1, 0)
                var s_0 = srcWidth * y
                var s_p1 = srcWidth * Math.min(y + 1, srcHeight - 1)
                var s_p2 = srcWidth * Math.min(y + 2, srcHeight - 1)

                for (var x = 0; x < srcWidth; ++x) {
                    var x_m1 = Math.max(x - 1, 0)
                    var x_p1 = Math.min(x + 1, srcWidth - 1)
                    var x_p2 = Math.min(x + 2, srcWidth - 1)

                    ker4.a = src[s_m1 + x_m1]
                    ker4.b = src[s_m1 + x]
                    ker4.c = src[s_m1 + x_p1]
                    ker4.d = src[s_m1 + x_p2]

                    ker4.e = src[s_0 + x_m1]
                    ker4.f = src[s_0 + x]
                    ker4.g = src[s_0 + x_p1]
                    ker4.h = src[s_0 + x_p2]

                    ker4.i = src[s_p1 + x_m1]
                    ker4.j = src[s_p1 + x]
                    ker4.k = src[s_p1 + x_p1]
                    ker4.l = src[s_p1 + x_p2]

                    ker4.m = src[s_p2 + x_m1]
                    ker4.n = src[s_p2 + x]
                    ker4.o = src[s_p2 + x_p1]
                    ker4.p = src[s_p2 + x_p2]

                    preProcessCorners(ker4)

                    preProcBuffer[x] = BlendInfo.setTopR(preProcBuffer[x], blendResult.j)
                    if (x + 1 < srcWidth) {
                        preProcBuffer[x + 1] = BlendInfo.setTopL(preProcBuffer[x + 1] & 0xff, blendResult.k)
                    }
                }
            }

            outputMatrix = new OutputMatrix(scaleSize, trg, trgWidth)

            var blend_xy = 0
            var blend_xy1 = 0

            var ker3 = []

            for (var y = yFirst; y < yLast; ++y) {
                var trgi = scaleSize * y * trgWidth
                var s_m1 = srcWidth * Math.max(y - 1, 0)
                var s_0 = srcWidth * y
                var s_p1 = srcWidth * Math.min(y + 1, srcHeight - 1)
                var s_p2 = srcWidth * Math.min(y + 2, srcHeight - 1)

                blend_xy1 = 0

                for (var x = 0; x < srcWidth; ++x, trgi += scaleSize) {
                    var x_m1 = Math.max(x - 1, 0)
                    var x_p1 = Math.min(x + 1, srcWidth - 1)
                    var x_p2 = Math.min(x + 2, srcWidth - 1)
                    {
                        ker4.a = src[s_m1 + x_m1]
                        ker4.b = src[s_m1 + x]
                        ker4.c = src[s_m1 + x_p1]
                        ker4.d = src[s_m1 + x_p2]

                        ker4.e = src[s_0 + x_m1]
                        ker4.f = src[s_0 + x]
                        ker4.g = src[s_0 + x_p1]
                        ker4.h = src[s_0 + x_p2]

                        ker4.i = src[s_p1 + x_m1]
                        ker4.j = src[s_p1 + x]
                        ker4.k = src[s_p1 + x_p1]
                        ker4.l = src[s_p1 + x_p2]

                        ker4.m = src[s_p2 + x_m1]
                        ker4.n = src[s_p2 + x]
                        ker4.o = src[s_p2 + x_p1]
                        ker4.p = src[s_p2 + x_p2]
                        preProcessCorners(ker4)

                        blend_xy = BlendInfo.setBottomR(preProcBuffer[x], blendResult.f)
                        blend_xy1 = BlendInfo.setTopR(blend_xy1, blendResult.j)
                        preProcBuffer[x] = blend_xy1

                        blend_xy1 = BlendInfo.setTopL(0, blendResult.k)
                        if (x + 1 < srcWidth) {
                            preProcBuffer[x + 1] = BlendInfo.setBottomL(preProcBuffer[x + 1], blendResult.g)
                        }
                    }

                    fillBlock(trg, trgi, trgWidth, src[s_0 + x], scaleSize)

                    if (blend_xy === 0) {
                        continue
                    }

                    var a = 0, b = 1, c = 2, d = 3, e = 4, f = 5, g = 6, h = 7, i = 8

                    ker3[a] = src[s_m1 + x_m1]
                    ker3[b] = src[s_m1 + x]
                    ker3[c] = src[s_m1 + x_p1]

                    ker3[d] = src[s_0 + x_m1]
                    ker3[e] = src[s_0 + x]
                    ker3[f] = src[s_0 + x_p1]

                    ker3[g] = src[s_p1 + x_m1]
                    ker3[h] = src[s_p1 + x]
                    ker3[i] = src[s_p1 + x_p1]

                    let scaler
                    switch (scaleSize) {
                        case 2:
                            scaler = new Scaler2x()
                            break
                        case 3:
                            scaler = new Scaler3x()
                            break
                        case 4:
                            scaler = new Scaler4x()
                            break
                        case 5:
                            scaler = new Scaler5x()
                            break
                        case 6:
                            scaler = new Scaler6x()
                            break
                        default:
                            scaler = new Scaler6x()
                            break
                    }

                    scalePixel(scaler, 0, ker3, trg, trgi, trgWidth, blend_xy)
                    scalePixel(scaler, 1, ker3, trg, trgi, trgWidth, blend_xy)
                    scalePixel(scaler, 2, ker3, trg, trgi, trgWidth, blend_xy)
                    scalePixel(scaler, 3, ker3, trg, trgi, trgWidth, blend_xy)
                }
            }
        }

        try {
            var source_buffer = Uint8ClampedArray.from(image_data.data);
            var width = parseInt(image_data.width);
            var height = parseInt(image_data.height);
            var source = new Array();
            for (var i = 0, len = source_buffer.length; i < len; i += 4) {
                var r = source_buffer[i];
                var g = source_buffer[i + 1];
                var b = source_buffer[i + 2];
                var a = source_buffer[i + 3];
                var pixel = a << 24 | r << 16 | g << 8 | b;
                source.push(pixel)
            }
            var target = new Array(width * scale * height * scale);
            target.fill(0);
            scaleImage(scale, source, target, width, height, 0, height);
            var target_buffer = new Uint8ClampedArray(target.length * 4);
            for (var i = 0, len = target.length; i < len; ++i) {
                var pixel = target[i];
                var a = (pixel >> 24) & 0xff;
                var r = (pixel >> 16) & 0xff;
                var g = (pixel >> 8) & 0xff;
                var b = (pixel) & 0xff;
                target_buffer[i*4+0] = r;
                target_buffer[i*4+1] = g;
                target_buffer[i*4+2] = b;
                target_buffer[i*4+3] = a;
            }

            try {

                resolve(new ImageData(target_buffer, width * scale, height * scale));
            } catch(e) {

                var canvas = document.createElement('canvas');
                canvas.width = width * scale;
                canvas.height = height * scale;
                var context = canvas.getContext('2d');
                var scaled_image_data = context.createImageData(canvas.width, canvas.height);
                scaled_image_data.data.set(target_buffer);

                return scaled_image_data;
            }

            resolve();
        } catch(e){reject(null)}
    })};

export default fun;