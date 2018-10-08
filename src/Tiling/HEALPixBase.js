/*******************************************************************************
 * Copyright 2017, 2018 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
 *
 * This file is part of MIZAR.
 *
 * MIZAR is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * MIZAR is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with MIZAR. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
/***************************************
 * Copyright 2011, 2012 GlobWeb contributors.
 *
 * This file is part of GlobWeb.
 *
 * GlobWeb is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, version 3 of the License, or
 * (at your option) any later version.
 *
 * GlobWeb is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GlobWeb. If not, see <http://www.gnu.org/licenses/>.
 ***************************************/

define(["underscore-min","./HEALPixTables", "../Utils/Long", "../Utils/CircleFinder", "../Utils/Constants", "../Gui/dialog/ErrorDialog"], function(
    _,
    HealPixTables,
    Long,
    CircleFinder,
    Constants,
    ErrorDialog
) {
    /**************************************************************************************************************/

    var HALF_PI = Math.PI * 0.5;

    var lonLat2ang = function(lon, lat) {
        if (lon < 0) {
            lon += 360;
        }

        var phi = (lon * Math.PI) / 180.0;

        var theta = ((-lat + 90.0) * Math.PI) / 180.0;
        return [phi, theta];
    };

    /**************************************************************************************************************/

    /** Returns the remainder of the division {@code v1/v2}.
     The result is non-negative.
     @param v1 dividend; can be positive or negative
     @param v2 divisor; must be positive
     @return Remainder of the division; positive and smaller than {@code v2} */
    var fmodulo = function(v1, v2) {
        if (v1 >= 0.0) {
            return v1 < v2 ? v1 : v1 % v2;
        }
        var tmp = (v1 % v2) + v2;
        return tmp === v2 ? 0.0 : tmp;
    };

    /**************************************************************************************************************/

    var spread_bits = function(v) {
        return (
            HealPixTables.utab[v & 0xff] |
            (HealPixTables.utab[(v >>> 8) & 0xff] << 16) |
            (HealPixTables.utab[(v >>> 16) & 0xff] << 32) |
            (HealPixTables.utab[(v >>> 24) & 0xff] << 48)
        );
    };

    /**************************************************************************************************************/

    var xyf2nest = function(ix, iy, face_num, order) {
        return (
            (face_num << (2 * order)) + spread_bits(ix) + (spread_bits(iy) << 1)
        );
    };

    /**************************************************************************************************************/

    var loc2pix = function(order, phi, theta) {
        var nside2 = Math.pow(2, order);
        var z = Math.cos(theta);
        //var phi = phi;

        var loc = {
            phi: phi,
            theta: theta,
            z: z
        };

        if (Math.abs(z) > 9.0 / 10.0) {
            loc.sth = Math.sin(theta);
            loc.have_sth = true;
        }

        var inv_halfpi = 2.0 / Math.PI;
        var tt = fmodulo(phi * inv_halfpi, 4.0); // in [0,4)
        var jp, jm, nSideMinusOne;
        var za = Math.abs(z);
        if (za <= 2.0 / 3.0) {
            // Equatorial region
            var temp1 = nside2 * (0.5 + tt);
            var temp2 = nside2 * (z * 0.75);

            jp = Long.fromNumber(temp1 - temp2);
            jm = Long.fromNumber(temp1 + temp2);
            var ifp = jp.shiftRightUnsigned(order);
            var ifm = jm.shiftRightUnsigned(order);
            var face_num;
            if (ifp.equals(ifm)) {
                face_num = ifp.or(Long.fromInt(4));
            } else {
                if (ifp.lessThan(ifm)) {
                    face_num = ifp;
                } else {
                    face_num = ifm.add(Long.fromInt(8));
                }
            }

            nSideMinusOne = Long.fromNumber(nside2 - 1);
            var ix = jm.and(nSideMinusOne);
            var iy = nSideMinusOne.subtract(jp.and(nSideMinusOne));

            return xyf2nest(ix.toInt(), iy.toInt(), face_num.toInt(), order);
        } // polar region, za > 2/3
        else {
            var ntt = parseInt(Math.min(3, parseInt(tt, 10)), 10);
            var tp = tt - ntt;
            var tmp =
                za < 9.0 / 10.0 || !loc.have_sth
                    ? nside2 * Math.sqrt(3 * (1 - za))
                    : (nside2 * loc.sth) / Math.sqrt((1.0 + za) / 3.0);

            jp = Long.fromNumber(tp * tmp);
            jm = Long.fromNumber((1.0 - tp) * tmp);
            var lNside = Long.fromNumber(nside2);
            nSideMinusOne = Long.fromNumber(nside2 - 1.0);
            var lOne = Long.fromInt(1);
            if (jp.greaterThanOrEqual(lNside)) {
                jp = nSideMinusOne;
            }
            if (jm.greaterThanOrEqual(lNside)) {
                jm = nSideMinusOne;
            }

            if (z >= 0) {
                return xyf2nest(
                    lNside
                        .subtract(jm)
                        .subtract(lOne)
                        .toInt(),
                    lNside
                        .subtract(jp)
                        .subtract(lOne)
                        .toInt(),
                    ntt,
                    order
                );
            } else {
                return xyf2nest(jp.toInt(), jm.toInt(), ntt + 8, order);
            }
        }
    };

    var pstack = function(sz) {
        this.p = new Array(sz);
        this.o = new Array(sz);

        for (var i = 0; i < this.p.length; i++) {
            //this.p[i] = Long.fromInt(0);
            this.p[i] = 0;
            this.o[i] = 0;
        }

        this.s = this.m = 0;
    };

    pstack.prototype.push = function(p_, o_) {
        this.p[this.s] = p_;
        this.o[this.s] = o_;
        ++this.s;
    };

    pstack.prototype.otop = function() {
        return this.o[this.s - 1];
    };

    pstack.prototype.ptop = function() {
        return this.p[this.s - 1];
    };

    pstack.prototype.pop = function() {
        this.s--;
    };

    pstack.prototype.popToMark = function() {
        this.s = this.m;
    };

    pstack.prototype.mark = function() {
        this.m = this.s;
    };

    pstack.prototype.size = function() {
        return this.s;
    };

    /**************************************************************************************************************/

    var HEALPixBase = {
        init: function(options) {
            this.order_max = 29;
            this.bn = [];
            this.nside = null;

            try {
                for (var i = 0; i <= this.order_max; ++i) {
                    this.bn[i] = this.createBoundaries(1.0 << i, "NESTED");
                }
            } catch (ex) {
                /*doesn't happen*/
            }
        },

        createBoundaries: function(nside_in, scheme_in) {
            this.nside = nside_in - 1;
            return this.calculateBoundaries(nside_in, scheme_in);
        },

        compress_bits: function(v) {
            var longV = Long.fromNumber(v);
            var longMask = Long.fromNumber(0x5555555555555);
            var raw = longV.and(longMask);
            var dec = raw.shiftRightUnsigned(15);
            raw = raw.or(dec);
            var raw1 = raw.and(Long.fromNumber(0xffff)).toInt();
            var dec2 = raw.shiftRightUnsigned(32);
            var raw2 = dec2.and(Long.fromNumber(0xffff)).toInt();

            return (
                HealPixTables.ctab[raw1 & 0xff] |
                (HealPixTables.ctab[raw1 >>> 8] << 4) |
                (HealPixTables.ctab[raw2 & 0xff] << 16) |
                (HealPixTables.ctab[raw2 >>> 8] << 20)
            );
        },

        /**
         *    Function describing a location on the sphere
         */
        fxyf: function(_fx, _fy, _face) {
            var jr = HealPixTables.jrll[_face] - _fx - _fy;
            var z = 0;
            var phi = 0;
            var sth = 0;
            var have_sth = false;

            var nr, tmp;
            if (jr < 1) {
                nr = jr;
                tmp = (nr * nr) / 3.0;
                z = 1 - tmp;
                if (z > 0.99) {
                    sth = Math.sqrt(tmp * (2.0 - tmp));
                    have_sth = true;
                }
            } else if (jr > 3) {
                nr = 4 - jr;
                tmp = (nr * nr) / 3.0;
                z = tmp - 1;
                if (z < -0.99) {
                    sth = Math.sqrt(tmp * (2.0 - tmp));
                    have_sth = true;
                }
            } else {
                nr = 1;
                z = ((2 - jr) * 2.0) / 3.0;
            }

            tmp = HealPixTables.jpll[_face] * nr + _fx - _fy;
            if (tmp < 0) {
                tmp += 8;
            }
            if (tmp >= 8) {
                tmp -= 8;
            }

            phi = nr < 1e-15 ? 0 : (0.5 * HALF_PI * tmp) / nr;

            var st = have_sth ? sth : Math.sqrt((1.0 - z) * (1.0 + z));
            return [st * Math.cos(phi), st * Math.sin(phi), z];
        },

        /** Returns the maximum angular distance between a pixel center and its
         corners.
         @return number angular distance between a pixel center and its
         corners. */
        maxPixrad: function(order, nl4) {
            var nside2 = Math.pow(2, order);
            var va = vec3.createZPhi(2.0 / 3.0, Math.PI / nl4);
            var t1 = 1.0 - 1.0 / nside2;
            t1 *= t1;
            var vb = vec3.createZPhi(1 - t1 / 3, 0);
            return vec3.angle2(va, vb);
        },

        pix2vec: function(pix, boundaries) {
            var loc = this.pix2loc(pix, boundaries);
            var st = loc.have_sth
                ? loc.sth
                : Math.sqrt((1.0 - loc.z) * (1.0 + loc.z));
            return vec3.createFrom(
                st * Math.cos(loc.phi),
                st * Math.sin(loc.phi),
                loc.z
            );
        },

        pix2loc: function(pix, boundaries) {
            var z, phi, sth, have_sth;

            //var fact2 = 4.0 / pix;
            //var fact1 = (nside << 1) * fact2;
            //var nl2 = 2 * nside;
            //var nl3 = 3 * nside;
            //var nl4 = 4 * nside;
            //var npface = nside * nside;
            //var ncap = 2 * nside * (nside - 1); // pixels in each polar cap
            //var npix = 12 * npface;
            //var fact2 = 4.0 / npix;
            //var fact1 = (nside << 1) * fact2;

            var loc = {
                phi: null,
                sth: 0.0,
                have_sth: false,
                z: null
            };

            var xyf = this.nest2xyf(pix, boundaries.npface, boundaries.order);

            var jr =
                (HealPixTables.jrll[xyf.face] << boundaries.order) -
                xyf.ix -
                xyf.iy -
                1;

            var nr, tmp;
            if (jr < boundaries.nside) {
                nr = jr;
                tmp = nr * nr * boundaries.fact2;
                loc.z = 1 - tmp;
                if (loc.z > 0.99) {
                    loc.sth = Math.sqrt(tmp * (2.0 - tmp));
                    loc.have_sth = true;
                }
            } else if (jr > boundaries.nl3) {
                nr = boundaries.nl4 - jr;
                tmp = nr * nr * boundaries.fact2;
                loc.z = tmp - 1;
                if (loc.z < -0.99) {
                    loc.sth = Math.sqrt(tmp * (2.0 - tmp));
                    loc.have_sth = true;
                }
            } else {
                nr = boundaries.nside;
                loc.z = (boundaries.nl2 - jr) * boundaries.fact1;
            }

            tmp = HealPixTables.jpll[xyf.face] * nr + xyf.ix - xyf.iy;
            //assert (tmp < 8 * nr); // must not happen

            if (tmp < 0) {
                tmp += 8 * nr;
            }

            loc.phi =
                nr === boundaries.nside
                    ? 0.75 * HALF_PI * tmp * boundaries.fact1
                    : (0.5 * HALF_PI * tmp) / nr;
            return loc;
        },

        nest2xyf: function(ipix, npface, order) {
            var pix = ipix & (npface - 1);

            var ix = HEALPixBase.compress_bits(pix);
            var iy = HEALPixBase.compress_bits(pix >>> 1);
            var face = ipix >>> (2 * order);

            return {
                ix: ix,
                iy: iy,
                face: face
            };
        },

        /**
         *    Static function
         *    Convert nside to order
         *    (ilog2(nside))
         */
        nside2order: function(arg) {
            var res = 0;
            while (arg > 0x0000ffff) {
                res += 16;
                arg >>>= 16;
            }
            if (arg > 0x000000ff) {
                res |= 8;
                arg >>>= 8;
            }
            if (arg > 0x0000000f) {
                res |= 4;
                arg >>>= 4;
            }
            if (arg > 0x00000003) {
                res |= 2;
                arg >>>= 2;
            }
            if (arg > 0x00000001) {
                res |= 1;
            }
            return res;
        },

        calculateBoundaries: function(nside_in, scheme_in) {
            if (this.nside === nside_in) {
                return;
            }
            this.nside = nside_in;

            var order = this.nside2order(nside_in);

            if (scheme_in === "NESTED" && order < 0) {
                throw new Error(
                    "Nside must be a power of 2 for NESTED scheme"
                );
            }

            var nl2 = 2 * this.nside;
            var nl3 = 3 * this.nside;
            var nl4 = 4 * this.nside;
            var npface = this.nside * this.nside;
            var ncap = 2 * this.nside * (this.nside - 1); // pixels in each polar cap
            var npix = 12 * npface;
            var fact2 = 4.0 / npix;
            var fact1 = (this.nside << 1) * fact2;

            return {
                order: order,
                nside: this.nside,
                scheme: scheme_in,
                nl2: nl2,
                nl3: nl3,
                nl4: nl4,
                npface: npface,
                ncap: ncap,
                npix: npix,
                fact1: fact1,
                fact2: fact2
            };
        },

        // MATH lib from Java Astro lib

        convertPolygonToHealpixOrder: function(coordinates, fact, order) {
            var vertex = [];
            var factor = fact || 4;
            var healpixOrder = order || 5;

            _.each(coordinates, function(point) {
                var cPr = Math.PI / 180;

                var cd = Math.cos(point[1] * cPr);
                var x = Math.cos(point[0] * cPr) * cd;
                var y = Math.sin(point[0] * cPr) * cd;
                var z = Math.sin(point[1] * cPr);

                var theta = Math.atan2(Math.sqrt(x * x + y * y), z);
                var phi = Math.atan2(y, x);
                if (phi < 0.0) {
                    phi += 2 * Math.PI;
                }
                if (phi >= 2 * Math.PI) {
                    phi -= 2 * Math.PI;
                }

                vertex.push({
                    theta: theta,
                    phi: phi
                });
            });

            return this.queryPolygonInclusive(vertex, factor, healpixOrder);
        },

        queryPolygonInclusive: function(vertex, fact, healpixOrder) {
            Math.PI = 3.14159265358979323846;
            var halfpi = Math.PI / 2.0;

            var inclusive = fact !== 0;
            var nv = vertex.length;
            var ncirc = inclusive ? nv + 1 : nv;

            if (nv < 3) {
                ErrorDialog.open(Constants.LEVEL.DEBUG, "HEALPixBase.js", "not enough vertices in polygon");
                return;
            }

            var vv = new Array(nv);
            var i;
            for (i = 0; i < nv; ++i) {
                vv[i] = vec3.createPhiTheta(vertex[i].phi, vertex[i].theta);
            }

            var normal = new Array(ncirc);
            var flip = 0;

            for (i = 0; i < nv; ++i) {
                normal[i] = vec3.cross2(vv[i], vv[(i + 1) % nv]);

                //var hnd = normal[i].dot(vv[(i + 2) % nv]);
                var hnd = vec3.dot2(normal[i], vv[(i + 2) % nv]);

                if (i === 0) {
                    flip = hnd < 0.0 ? -1 : 1;
                }

                normal[i] = vec3.scale2(
                    normal[i],
                    flip / vec3.length2(normal[i])
                );
            }

            var rad = new Array(ncirc);
            this.fill(rad, halfpi);

            if (inclusive) {
                var cf = new CircleFinder(vv);

                normal[nv] = cf.getCenter();
                rad[nv] = Math.acos(cf.getCosRad());
            }

            var res = this.queryMultiDisc(normal, rad, fact, healpixOrder);
            ErrorDialog.open(Constants.LEVEL.DEBUG, "HEALPixBase.js", res);
            return res;
        },

        fill: function(a, val) {
            for (var i = 0, len = a.length; i < len; i++) {
                a[i] = val;
            }
        },

        queryMultiDisc: function(norm, rad, fact, healpixOrder) {
            var order = healpixOrder;
            var inclusive = fact !== 0;
            var nv = norm.length;
            //HealpixUtils.check(nv == rad.length, "inconsistent input arrays");
            var res = [];

            var oplus = 0;
            if (inclusive) {
                //HealpixUtils.check((1L << (order_max - order)) >= fact, "invalid oversampling factor");
                //HealpixUtils.check((fact & (fact - 1)) == 0, "oversampling factor must be a power of 2");
                oplus = this.ilog2(fact);
            }
            var omax = order + oplus; // the order up to which we test
            var currentBoundaries;

            // TODO: ignore all disks with radius>=pi

            // building 3 dimensions array
            var crlimit = new Array(omax + 1);
            for (var i = 0; i < omax + 1; i++) {
                crlimit[i] = new Array(nv);
                for (var j = 0; j < nv; j++) {
                    crlimit[i][j] = new Array(3);
                }
            }

            var options = {
                order: order
            };
            HEALPixBase.init(options); // set variables nl2, nl3, npix, nface...
            var o;
            for (
                o = 0;
                o <= omax;
                ++o // prepare data at the required orders
            ) {
                currentBoundaries = HEALPixBase.bn[o];
                var dr = HEALPixBase.maxPixrad(o, currentBoundaries.nl4); // safety distance

                for (i = 0; i < nv; ++i) {
                    crlimit[o][i][0] =
                        rad[i] + dr > Math.PI ? -1 : Math.cos(rad[i] + dr);
                    crlimit[o][i][1] =
                        o === 0 ? Math.cos(rad[i]) : crlimit[0][i][1];
                    crlimit[o][i][2] =
                        rad[i] - dr < 0.0 ? 1.0 : Math.cos(rad[i] - dr);
                }
            }

            var stk = new pstack(12 + 3 * omax);
            for (i = 0; i < 12; i++) {
                // insert the 12 base pixels in reverse order
                stk.push(11 - i, 0);
            }

            while (stk.size() > 0) {
                // as long as there are pixels on the stack
                // pop current pixel number and order from the stack
                var pix = stk.ptop();
                o = stk.otop();
                stk.pop();

                currentBoundaries = HEALPixBase.bn[o];

                var pv = HEALPixBase.pix2vec(pix, currentBoundaries);

                var zone = 3;
                for (i = 0; i < nv && zone > 0; ++i) {
                    var crad = vec3.dot2(pv, norm[i]);

                    for (var iz = 0; iz < zone; ++iz) {
                        if (crad < crlimit[o][i][iz]) {
                            zone = iz;
                            //console.log("zone :" + zone + " pix:" + pix + " crad:" + crad);
                        }
                    }
                }

                if (zone > 0) {
                    this.check_pixel(
                        o,
                        omax,
                        zone,
                        res,
                        pix,
                        stk,
                        inclusive,
                        healpixOrder
                    );
                }
            }
            return res;
        },

        check_pixel: function(
            o,
            omax,
            zone,
            pixset,
            pix,
            stk,
            inclusive,
            healpixOrder
        ) {
            var order = healpixOrder;
            var i;
            if (zone === 0) {
                return;
            }

            if (o < order) {
                if (zone >= 3) {
                    // output all subpixels
                    var sdist = 2 * (order - o); // the "bit-shift distance" between map orders
                    var start = pix << sdist;
                    var end = (pix + 1) << sdist;
                    for (i = start; i <= end; i++) {
                        pixset.push(i);
                    }
                } else {
                    // (zone>=1)
                    for (i = 0; i < 4; ++i) {
                        stk.push(4 * pix + 3 - i, o + 1); // add children
                    }
                }
            } else if (o > order) {
                // this implies that inclusive==true
                if (zone >= 2) {
                    // pixel center in shape
                    pixset.push(pix >>> (2 * (o - order))); // output the parent pixel at order
                    stk.popToMark(); // unwind the stack
                } // (zone>=1): pixel center in safety range
                else {
                    if (o < omax) {
                        // check sublevels
                        for (i = 0; i < 4; ++i) {
                            // add children in reverse order
                            stk.push(4 * pix + 3 - i, o + 1); // add children
                        }
                    } else {
                        // at resolution limit
                        pixset.push(pix >>> (2 * (o - order))); // output the parent pixel at order
                        stk.popToMark(); // unwind the stack
                    }
                }
            } // o==order
            else {
                if (zone >= 2) {
                    pixset.push(pix);
                } else if (inclusive) {
                    // and (zone>=1)
                    if (order < omax) {
                        // check sublevels
                        stk.mark(); // remember current stack position
                        for (i = 0; i < 4; ++i) {
                            // add children in reverse order
                            stk.push(4 * pix + 3 - i, o + 1); // add children
                        }
                    } else {
                        // at resolution limit
                        pixset.push(pix); // output the pixel
                    }
                }
            }
        },

        ilog2: function(arg) {
            var res = 0;
            while (arg > 0x0000ffff) {
                res += 16;
                arg >>>= 16;
            }
            if (arg > 0x000000ff) {
                res |= 8;
                arg >>>= 8;
            }
            if (arg > 0x0000000f) {
                res |= 4;
                arg >>>= 4;
            }
            if (arg > 0x00000003) {
                res |= 2;
                arg >>>= 2;
            }
            if (arg > 0x00000001) {
                res |= 1;
            }
            return res;
        },
        /**
         *    Returns pixel index of point on sphere
         *
         *    @param order Tile order
         *    @param lon Longitude
         *    @param lat Latitude
         */
        lonLat2pix: function(order, lon, lat) {
            var loc = lonLat2ang(lon, lat);
            return loc2pix(order, loc[0], loc[1]);
        },

        /**
         Create the children of the given pixel
         */
        getChildren: function(npix) {
            return [npix * 4, npix * 4 + 1, npix * 4 + 2, npix * 4 + 3];
        },

        uniq2hpix: function(uniq, hpix) {
            if (hpix == null) {
                hpix = [];
            }
            hpix[0] = HEALPixBase.log2(uniq / 4) / 2;
            var nside = HEALPixBase.pow2(hpix[0]);
            hpix[1] = uniq - 4 * nside * nside;
            hpix[0] = parseInt(hpix[0], 10);
            return hpix;
        },

        log2: function(nside) {
            var i = 0;
            while (nside >>> ++i > 0) {
                // nop
            }
            return --i;
        },

        pow2: function(order) {
            return 1 << order;
        },

        /**
         * calculates angular resolution of the pixel map in arc seconds.
         *
         * @param nside
         * @return double resolution in arcsec
         */
        getPixRes: function(nside) {
            var rad2arcsec = (180.0 * 60.0 * 60.0) / Math.PI;
            return rad2arcsec * Math.sqrt((4 * Math.PI) / (12 * nside * nside));
        }
    };

    /**************************************************************************************************************/

    return HEALPixBase;
});
