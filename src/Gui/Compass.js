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
/*global define: false */

/**
 * Compass module : map control with "north" composant
 */
define(["jquery", "../Utils/Constants", "../Services/CompassCore", "../Utils/Utils"],
    function ($, Constants, CompassCore, Utils) {

        const COMPASS_SVG = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjw/eG1sLXN0eWxlc2hlZXQgdHlwZT0idGV4dC9jc3MiIGhyZWY9ImNvbXBhc3MuY3NzIj8+PHN2ZwogICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgd2lkdGg9IjUyMCIKICAgaGVpZ2h0PSI1MjAiCiAgIGlkPSJzdmcyIgogICB2ZXJzaW9uPSIxLjEiCiAgIGlua3NjYXBlOnZlcnNpb249IjAuNDguMSByOTc2MCIKICAgc29kaXBvZGk6ZG9jbmFtZT0iY29tcGFzc05vcnRoMi5zdmciCiAgIHZpZXdCb3g9Ii0yMjAgLTIyMCA1MjAgNTIwIj4KICA8bWV0YWRhdGEKICAgICBpZD0ibWV0YWRhdGE0NSI+CiAgICA8cmRmOlJERj4KICAgICAgPGNjOldvcmsKICAgICAgICAgcmRmOmFib3V0PSIiPgogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PgogICAgICAgIDxkYzp0eXBlCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4KICAgICAgICA8ZGM6dGl0bGUgLz4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPGRlZnMKICAgICBpZD0iZGVmczQzIj4KICAgIDxyYWRpYWxHcmFkaWVudAogICAgICAgaWQ9ImdyYWQxIgogICAgICAgY3g9IjAiCiAgICAgICBjeT0iMCIKICAgICAgIHI9IjIwNyIKICAgICAgIGZ4PSIwIgogICAgICAgZnk9IjAiCiAgICAgICBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICAgIDxzdG9wCiAgICAgICAgIG9mZnNldD0iMC43NSIKICAgICAgICAgaWQ9InN0b3A2IgogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZmZmO3N0b3Atb3BhY2l0eTowIiAvPgogICAgICA8c3RvcAogICAgICAgICBvZmZzZXQ9IjAuOTQ5OTk5OTkiCiAgICAgICAgIGlkPSJzdG9wOCIKICAgICAgICAgc3R5bGU9InN0b3AtY29sb3I6I2ZmOTkwMDtzdG9wLW9wYWNpdHk6MSIgLz4KICAgICAgPHN0b3AKICAgICAgICAgb2Zmc2V0PSIxMDAlIgogICAgICAgICBzdHlsZT0ic3RvcC1jb2xvcjpyZ2IoMjU1LCAyNTUsIDI1NSk7c3RvcC1vcGFjaXR5OjAiCiAgICAgICAgIGlkPSJzdG9wMTAiIC8+CiAgICA8L3JhZGlhbEdyYWRpZW50PgogIDwvZGVmcz4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIgogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICAgIGJvcmRlcm9wYWNpdHk9IjEiCiAgICAgb2JqZWN0dG9sZXJhbmNlPSIxMCIKICAgICBncmlkdG9sZXJhbmNlPSIxMCIKICAgICBndWlkZXRvbGVyYW5jZT0iMTAiCiAgICAgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAiCiAgICAgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIKICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9IjEyODAiCiAgICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iMTAwMCIKICAgICBpZD0ibmFtZWR2aWV3NDEiCiAgICAgc2hvd2dyaWQ9ImZhbHNlIgogICAgIGlua3NjYXBlOnpvb209IjAuNDEzMTgxODMiCiAgICAgaW5rc2NhcGU6Y3g9IjEwMy43NDIwNiIKICAgICBpbmtzY2FwZTpjeT0iNDguNTQ5MDc0IgogICAgIGlua3NjYXBlOndpbmRvdy14PSIwIgogICAgIGlua3NjYXBlOndpbmRvdy15PSIyNCIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIgogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9IkVhc3QiCiAgICAgc2hvd2d1aWRlcz0idHJ1ZSIKICAgICBpbmtzY2FwZTpndWlkZS1iYm94PSJ0cnVlIj4KICAgIDxpbmtzY2FwZTpncmlkCiAgICAgICB0eXBlPSJ4eWdyaWQiCiAgICAgICBpZD0iZ3JpZDMwMTAiCiAgICAgICBlbXBzcGFjaW5nPSI1IgogICAgICAgdmlzaWJsZT0idHJ1ZSIKICAgICAgIGVuYWJsZWQ9InRydWUiCiAgICAgICBzbmFwdmlzaWJsZWdyaWRsaW5lc29ubHk9InRydWUiIC8+CiAgPC9zb2RpcG9kaTpuYW1lZHZpZXc+CiAgPGcKICAgICBpZD0iT3V0ZXJDaXJjbGUiCiAgICAgdHJhbnNmb3JtPSJtYXRyaXgoMS4xNDI4MTM4LDAsMCwxLjEwNTc4OCwwLjMwODI3MzYsNC42MTQ3ODQpIj4KICAgIDxnCiAgICAgICBpZD0iZzMyNjciCiAgICAgICBzdHlsZT0ib3BhY2l0eTowLjYiPgogICAgICA8Y2lyY2xlCiAgICAgICAgIHNvZGlwb2RpOnJ5PSIyMDciCiAgICAgICAgIHNvZGlwb2RpOnJ4PSIyMDciCiAgICAgICAgIHNvZGlwb2RpOmN5PSIwIgogICAgICAgICBzb2RpcG9kaTpjeD0iMCIKICAgICAgICAgY3k9IjAiCiAgICAgICAgIGN4PSIwIgogICAgICAgICBkPSJtIDIwNywwIGMgMCwxMTQuMzIyOTQgLTkyLjY3NzA2LDIwNyAtMjA3LDIwNyAtMTE0LjMyMjk0LDAgLTIwNywtOTIuNjc3MDYgLTIwNywtMjA3IDAsLTExNC4zMjI5NCA5Mi42NzcwNiwtMjA3IDIwNywtMjA3IDExNC4zMjI5NCwwIDIwNyw5Mi42NzcwNiAyMDcsMjA3IHoiCiAgICAgICAgIGlkPSJjaXJjbGUyNCIKICAgICAgICAgcj0iMjA3IgogICAgICAgICBzdHlsZT0ib3BhY2l0eTowLjc1O2ZpbGw6dXJsKCNncmFkMSkiCiAgICAgICAgIHRyYW5zZm9ybT0ibWF0cml4KDEuMTA1MjI3OSwwLDAsMS4xMDUyMjc5LDM0LDMyKSIgLz4KICAgIDwvZz4KICAgIDxnCiAgICAgICBpZD0iZzE4IgogICAgICAgc3R5bGU9InN0cm9rZTojZmZmZmZmO3N0cm9rZS13aWR0aDoxMCIKICAgICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuOTY1NTg4OTksMCwwLDAuOTcxMzI0MTUsMzQsMzIpIj4KICAgICAgPGNpcmNsZQogICAgICAgICByPSIyMTEiCiAgICAgICAgIGlkPSJjaXJjbGUyMCIKICAgICAgICAgZD0ibSAyMTEsMCBjIDAsMTE2LjUzMjA4IC05NC40Njc5MiwyMTEgLTIxMSwyMTEgLTExNi41MzIwOCwwIC0yMTEsLTk0LjQ2NzkyIC0yMTEsLTIxMSAwLC0xMTYuNTMyMDggOTQuNDY3OTIsLTIxMSAyMTEsLTIxMSAxMTYuNTMyMDgsMCAyMTEsOTQuNDY3OTIgMjExLDIxMSB6IgogICAgICAgICBjeD0iMCIKICAgICAgICAgY3k9IjAiCiAgICAgICAgIHNvZGlwb2RpOmN4PSIwIgogICAgICAgICBzb2RpcG9kaTpjeT0iMCIKICAgICAgICAgc29kaXBvZGk6cng9IjIxMSIKICAgICAgICAgc29kaXBvZGk6cnk9IjIxMSIgLz4KICAgIDwvZz4KICA8L2c+CiAgPGcKICAgICBpZD0iU291dGgiCiAgICAgY2xhc3M9ImFycm93IgogICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDM5LjU3ODM4MywzNi45NzA0MzUpIj4KICAgIDxwYXRoCiAgICAgICBzdHlsZT0iZmlsbDojZmZmZmZmO3N0cm9rZTojZmZmZmZmO3N0cm9rZS13aWR0aDoxIgogICAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgICAgIGlkPSJIYWxmQXJyb3ciCiAgICAgICBkPSJNIDM5LjQxNiw5NS4xNiBDIDMzLjY1LDEwMy45NSAzMC43NiwxMTAuNSAyOC45MywxMTcuMTggMTUuMjQsMTEzLjQzIDEzLjU0LDEyNy4xNSAyMy4wNCwxMzEgMTMuNzEsMTQ1LjggNy44NCwxNzMuOTMgMCwyMTIgTCAwLDEwMyBhIDEwMywxMDMgMCAwIDAgMzkuNDE2LC03Ljg0IHoiIC8+CiAgICA8dXNlCiAgICAgICBoZWlnaHQ9IjQ0MCIKICAgICAgIHdpZHRoPSI0NDAiCiAgICAgICB5PSIwIgogICAgICAgeD0iMCIKICAgICAgIGlkPSJzb3V0aCIKICAgICAgIHRyYW5zZm9ybT0ibWF0cml4KC0xLDAsMCwxLDIsMCkiCiAgICAgICB4bGluazpocmVmPSIjSGFsZkFycm93IiAvPgogIDwvZz4KICA8ZwogICAgIGlkPSJFYXN0IgogICAgIGNsYXNzPSJhcnJvdyIKICAgICB0cmFuc2Zvcm09Im1hdHJpeCgwLDEsLTEsMCwzOC44MDYyMSwzNy4yMjA0MjkpIj4KICAgIDxwYXRoCiAgICAgICBzdHlsZT0iZmlsbDojZmZmZmZmO3N0cm9rZTojZmZmZmZmO3N0cm9rZS13aWR0aDoxIgogICAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgICAgIGlkPSJIYWxmQXJyb3ctNiIKICAgICAgIGQ9Ik0gMzkuNDE2LDk1LjE2IEMgMzMuNjUsMTAzLjk1IDMwLjc2LDExMC41IDI4LjkzLDExNy4xOCAxNS4yNCwxMTMuNDMgMTMuNTQsMTI3LjE1IDIzLjA0LDEzMSAxMy43MSwxNDUuOCA3Ljg0LDE3My45MyAwLDIxMiBMIDAsMTAzIGEgMTAzLDEwMyAwIDAgMCAzOS40MTYsLTcuODQgeiIgLz4KICAgIDx1c2UKICAgICAgIGhlaWdodD0iNDQwIgogICAgICAgd2lkdGg9IjQ0MCIKICAgICAgIHk9IjAiCiAgICAgICB4PSIwIgogICAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZiIKICAgICAgIGlkPSJzb3V0aC01IgogICAgICAgdHJhbnNmb3JtPSJtYXRyaXgoLTEsMCwwLDEsMiwwKSIKICAgICAgIHhsaW5rOmhyZWY9IiNIYWxmQXJyb3ctNiIgLz4KICA8L2c+CiAgPGcKICAgICBpZD0iTm9ydGgiCiAgICAgY2xhc3M9ImFycm93IgogICAgIHRyYW5zZm9ybT0ibWF0cml4KC0xLDAsMCwtMSw0MS45MDI3OCw0My43ODMzNzYpIj4KICAgIDxwYXRoCiAgICAgICBzdHlsZT0iZmlsbDojZmZmZmZmO3N0cm9rZTojZmZmZmZmO3N0cm9rZS13aWR0aDoxIgogICAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgICAgIGlkPSJIYWxmQXJyb3ctNi0wIgogICAgICAgZD0iTSAzOS40MTYsOTUuMTYgQyAzMy42NSwxMDMuOTUgMzAuNzYsMTEwLjUgMjguOTMsMTE3LjE4IDE1LjI0LDExMy40MyAxMy41NCwxMjcuMTUgMjMuMDQsMTMxIDEzLjcxLDE0NS44IDcuODQsMTczLjkzIDAsMjEyIEwgMCwxMDMgYSAxMDMsMTAzIDAgMCAwIDM5LjQxNiwtNy44NCB6IiAvPgogICAgPHVzZQogICAgICAgaGVpZ2h0PSI0NDAiCiAgICAgICB3aWR0aD0iNDQwIgogICAgICAgeT0iMCIKICAgICAgIHg9IjAiCiAgICAgICBzdHlsZT0iZmlsbDojZmZmZmZmIgogICAgICAgaWQ9InNvdXRoLTUtNiIKICAgICAgIHRyYW5zZm9ybT0ibWF0cml4KC0xLDAsMCwxLDIsMCkiCiAgICAgICB4bGluazpocmVmPSIjSGFsZkFycm93LTYtMCIgLz4KICA8L2c+CiAgPGcKICAgICBpZD0iV2VzdCIKICAgICBjbGFzcz0iYXJyb3ciCiAgICAgdHJhbnNmb3JtPSJtYXRyaXgoMCwtMSwxLDAsMzcuMzc0NzU4LDM5LjU0NzAyMykiPgogICAgPHBhdGgKICAgICAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7c3Ryb2tlOiNmZmZmZmY7c3Ryb2tlLXdpZHRoOjEiCiAgICAgICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIgogICAgICAgaWQ9IkhhbGZBcnJvdy02LTAtNSIKICAgICAgIGQ9Ik0gMzkuNDE2LDk1LjE2IEMgMzMuNjUsMTAzLjk1IDMwLjc2LDExMC41IDI4LjkzLDExNy4xOCAxNS4yNCwxMTMuNDMgMTMuNTQsMTI3LjE1IDIzLjA0LDEzMSAxMy43MSwxNDUuOCA3Ljg0LDE3My45MyAwLDIxMiBMIDAsMTAzIGEgMTAzLDEwMyAwIDAgMCAzOS40MTYsLTcuODQgeiIgLz4KICAgIDx1c2UKICAgICAgIGhlaWdodD0iNDQwIgogICAgICAgd2lkdGg9IjQ0MCIKICAgICAgIHk9IjAiCiAgICAgICB4PSIwIgogICAgICAgaWQ9InNvdXRoLTUtNi0yIgogICAgICAgdHJhbnNmb3JtPSJtYXRyaXgoLTEsMCwwLDEsMiwwKSIKICAgICAgIHhsaW5rOmhyZWY9IiNIYWxmQXJyb3ctNi0wLTUiIC8+CiAgPC9nPgogIDx0ZXh0CiAgICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIKICAgICBzdHlsZT0iZm9udC1zaXplOjkwcHg7Zm9udC1zdHlsZTpub3JtYWw7Zm9udC12YXJpYW50Om5vcm1hbDtmb250LXdlaWdodDpib2xkO2ZvbnQtc3RyZXRjaDpub3JtYWw7dGV4dC1hbGlnbjpzdGFydDtsaW5lLWhlaWdodDoxMjkuOTk5OTk1MjMlO2xldHRlci1zcGFjaW5nOjBweDt3b3JkLXNwYWNpbmc6MHB4O3dyaXRpbmctbW9kZTpsci10Yjt0ZXh0LWFuY2hvcjpzdGFydDtmaWxsOiNmZjdmMmE7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmU7Zm9udC1mYW1pbHk6VGltZXMgTmV3IFJvbWFuOy1pbmtzY2FwZS1mb250LXNwZWNpZmljYXRpb246J1RpbWVzIE5ldyBSb21hbiwgQm9sZCciCiAgICAgeD0iMTkuMjU0ODc1IgogICAgIHk9Ii0xNjMuMDY2NzYiCiAgICAgaWQ9Ik5vcnRoVGV4dCIKICAgICBzb2RpcG9kaTpsaW5lc3BhY2luZz0iMTMwJSIKICAgICB0cmFuc2Zvcm09InNjYWxlKDEuMDA4MzY2NSwwLjk5MTcwMjkyKSI+PHRzcGFuCiAgICAgICBzb2RpcG9kaTpyb2xlPSJsaW5lIgogICAgICAgaWQ9InRzcGFuMzAyNCIKICAgICAgIHg9IjE5LjI1NDg3NSIKICAgICAgIHk9Ii0xNjMuMDY2NzYiCiAgICAgICBzdHlsZT0iZm9udC1zaXplOjgwcHg7Zm9udC1zdHlsZTpub3JtYWw7Zm9udC12YXJpYW50Om5vcm1hbDtmb250LXdlaWdodDpib2xkO2ZvbnQtc3RyZXRjaDpub3JtYWw7dGV4dC1hbGlnbjpzdGFydDtsaW5lLWhlaWdodDoxMjkuOTk5OTk1MjMlO3dyaXRpbmctbW9kZTpsci10Yjt0ZXh0LWFuY2hvcjpzdGFydDtmaWxsOiNmZjdmMmE7c3Ryb2tlOiMwMDAwMDA7c3Ryb2tlLXdpZHRoOjFweDtmb250LWZhbWlseTpUaW1lcyBOZXcgUm9tYW47LWlua3NjYXBlLWZvbnQtc3BlY2lmaWNhdGlvbjonVGltZXMgTmV3IFJvbWFuLCBCb2xkJyI+TjwvdHNwYW4+PC90ZXh0PgogIDxnCiAgICAgaWQ9IklubmVyQ2lyY2xlIgogICAgIHN0eWxlPSJvcGFjaXR5OjAuNiIKICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzOS4yNjA3MjYsNDEuMjEwMTIxKSI+CiAgICA8ZwogICAgICAgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6I2ZmZmZmZjtzdHJva2Utd2lkdGg6OCIKICAgICAgIGlkPSJnNyI+CiAgICAgIDxjaXJjbGUKICAgICAgICAgc29kaXBvZGk6cng9Ijc1IgogICAgICAgICBzb2RpcG9kaTpjeT0iMCIKICAgICAgICAgY3k9IjAiCiAgICAgICAgIGN4PSIwIgogICAgICAgICBkPSJNIDc1LDAgQyA3NSw0MS40MjEzNTYgNDEuNDIxMzU2LDc1IDAsNzUgLTQxLjQyMTM1Niw3NSAtNzUsNDEuNDIxMzU2IC03NSwwIGMgMCwtNDEuNDIxMzU2IDMzLjU3ODY0NCwtNzUgNzUsLTc1IDQxLjQyMTM1NiwwIDc1LDMzLjU3ODY0NCA3NSw3NSB6IgogICAgICAgICBpZD0iY2lyY2xlOSIKICAgICAgICAgcj0iNzUiCiAgICAgICAgIHNvZGlwb2RpOmN4PSIwIgogICAgICAgICBzb2RpcG9kaTpyeT0iNzUiIC8+CiAgICA8L2c+CiAgICA8ZwogICAgICAgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6IzFiMWIxYjtzdHJva2Utd2lkdGg6MSIKICAgICAgIGlkPSJnMTEiPgogICAgICA8Y2lyY2xlCiAgICAgICAgIHNvZGlwb2RpOnJ5PSI3MSIKICAgICAgICAgc29kaXBvZGk6cng9IjcxIgogICAgICAgICBzb2RpcG9kaTpjeT0iMCIKICAgICAgICAgc29kaXBvZGk6Y3g9IjAiCiAgICAgICAgIGN5PSIwIgogICAgICAgICBjeD0iMCIKICAgICAgICAgZD0iTSA3MSwwIEMgNzEsMzkuMjEyMjE3IDM5LjIxMjIxNyw3MSAwLDcxIC0zOS4yMTIyMTcsNzEgLTcxLDM5LjIxMjIxNyAtNzEsMCBjIDAsLTM5LjIxMjIxNyAzMS43ODc3ODMsLTcxIDcxLC03MSAzOS4yMTIyMTcsMCA3MSwzMS43ODc3ODMgNzEsNzEgeiIKICAgICAgICAgaWQ9ImNpcmNsZTEzIgogICAgICAgICByPSI3MSIgLz4KICAgICAgPGNpcmNsZQogICAgICAgICBzb2RpcG9kaTpyeT0iNzkiCiAgICAgICAgIHNvZGlwb2RpOnJ4PSI3OSIKICAgICAgICAgc29kaXBvZGk6Y3k9IjAiCiAgICAgICAgIHNvZGlwb2RpOmN4PSIwIgogICAgICAgICBjeT0iMCIKICAgICAgICAgY3g9IjAiCiAgICAgICAgIGQ9Ik0gNzksMCBDIDc5LDQzLjYzMDQ5NSA0My42MzA0OTUsNzkgMCw3OSAtNDMuNjMwNDk1LDc5IC03OSw0My42MzA0OTUgLTc5LDAgYyAwLC00My42MzA0OTUgMzUuMzY5NTA1LC03OSA3OSwtNzkgNDMuNjMwNDk1LDAgNzksMzUuMzY5NTA1IDc5LDc5IHoiCiAgICAgICAgIGlkPSJjaXJjbGUxNSIKICAgICAgICAgcj0iNzkiIC8+CiAgICA8L2c+CiAgPC9nPgo8L3N2Zz4K";

        /**
         * Create a compass Widget
         * @param options
         * @throws {ReferenceError} can't get the div to insert the compass
         * @throws {ReferenceError} Can't get the element name
         * @constructor
         * @fires AbstractContext#modifiedNavigation
         */
        var Compass = function (options) {
            /**
             *    Private variables
             */
            this.svgDoc = null;
            this.panFactor = options.panFactor ? options.panFactor : 30;
            this.parentElement = options.element;
            this.ctx = null;
            this.isMobile = options.isMobile;
            this.options = options;

            this._lastMouseX = -1;
            this._lastMouseY = -1;
            this._balanceX = -1;
            this._balanceY = -1;
            this._dx = 0;
            this._dy = 0;
            this.dragging = false;

            this.east = null;
            this.west = null;
            this.south = null;
            this.north = null;
            this.northText = null;
            this.outerCircle = null;


            //var self = this;

            // Add compass object to parent element
            // Don't use <object> HTML tag due to cross-origin nature of svg
            if(this.parentElement == null) {
                throw new ReferenceError("Can't get the element name from the options parameters")
            } else if (document.getElementById(this.parentElement) === null) {
                throw new ReferenceError("can't get the Div "+this.parentElement+" to insert the compass");
            } else {
                // OK
            }

            this.init();
        };

        /**************************************************************************************************************/

        /**
         * Handles mouse down event.
         * @param {Event} event
         * @param {Compass} self
         * @private
         */
        function _handleMouseDown(event, self) {
            if (event.type.search("touch") >= 0) {
                event.layerX = event.changedTouches[0].clientX;
                event.layerY = event.changedTouches[0].clientY;
                self._balanceX = event.layerX;
                self._balanceY = event.layerY;
            } else {
                self._balanceX = 0;
                self._balanceY = 0;
            }

            self.dragging = true;
            var _outerCircleRadius = self.outerCircle.ownerSVGElement.clientWidth / 2;
            self._lastMouseX = (event.layerX - self._balanceX) - _outerCircleRadius;
            self._lastMouseY = (event.layerY - self._balanceY) - _outerCircleRadius;
            self._dx = 0;
            self._dy = 0;
        }

        /**
         * Handles mouse move event.
         * @param {Event} event
         * @param {Compass} self
         * @private
         */
        function _handleMouseMove(event, self) {
            if (event.type.search("touch") >= 0) {
                event.layerX = event.changedTouches[0].clientX - self._balanceX;
                event.layerY = event.changedTouches[0].clientY - self._balanceY;
            }

            if (!self.dragging) {
                return;
            }
            var _outerCircleRadius = self.outerCircle.ownerSVGElement.clientWidth / 2;
            var c = self._lastMouseX * (event.layerY - _outerCircleRadius) - self._lastMouseY * (event.layerX -
                _outerCircleRadius); // c>0 -> clockwise, counterclockwise otherwise

            self.ctx.getNavigation().rotate(c, 0);

            self._lastMouseX = event.layerX - _outerCircleRadius;
            self._lastMouseY = event.layerY - _outerCircleRadius;

            CompassCore.updateNorth();
        }

        /**
         * Handles mouse up event.
         * @param {Event} event
         * @param {Compass} self
         * @private
         */
        function _handleMouseUp(event, self) {
            event.preventDefault();
            self.dragging = false;
            // TODO add inertia
        }

        /**
         * Updates north compass from east move.
         * @param {Compass} self
         * @private
         */
        function _updateNorthFromEast(self) {
            self.ctx.getNavigation().pan(self.panFactor, 0.0);
            CompassCore.updateNorth();
        }

        /**
         * Updates north compass from west move.
         * @param {Compass} self
         * @private
         */
        function _updateNorthFromWest(self) {
            self.ctx.getNavigation().pan(-self.panFactor, 0.0);
            CompassCore.updateNorth();
        }

        /**
         * Updates north compass from north move.
         * @param {Compass} self
         * @private
         */
        function _updateNorthFromNorth(self) {
            self.ctx.getNavigation().pan(0, self.panFactor);
            CompassCore.updateNorth();
        }

        /**
         * Updates north compass from south move.
         * @param {Compass} self
         * @private
         */
        function _updateNorthFromSouth(self) {
            self.ctx.getNavigation().pan(0, -self.panFactor);
            CompassCore.updateNorth();
        }

        /**
         * Init compass.
         */
        Compass.prototype.init = function () {
            CompassCore.init({
                element:this.parentElement
            });
        };

        /**
         *    Remove compass element
         */
        Compass.prototype.remove = CompassCore.remove;
        Compass.prototype.setCtx = CompassCore.setCtx;
        Compass.prototype.setSvg = CompassCore.setSvg;

        /**************************************************************************************************************/


        /**
         * Attachs the compass to the context.
         * @function attachTo
         * @memberOf Compass#
         */
        Compass.prototype.attachTo = function (context) {
            var self = this;
            this.ctx = context;
            this.setCtx(context);
            $.get(COMPASS_SVG,
                function (response) {
                    // Import contents of the svg document into this document
                    self.svgDoc = document.importNode(response.documentElement, true);
                    self.ctx = context;
                    /* Svg interactive elements */
                    self.east = self.svgDoc.getElementById("East"); //get the inner element by id
                    self.west = self.svgDoc.getElementById("West"); //get the inner element by id
                    self.south = self.svgDoc.getElementById("South"); //get the inner element by id
                    self.north = self.svgDoc.getElementById("North"); //get the inner element by id
                    self.northText = self.svgDoc.getElementById("NorthText");
                    self.outerCircle = self.svgDoc.getElementById("OuterCircle");

                    // Update width/height
                    self.svgDoc.height.baseVal.value = 100;
                    self.svgDoc.width.baseVal.value = 100;

                    // Append the imported SVG root element to the appropriate HTML element
                    document.getElementById(self.parentElement).innerHTML = '<div id="objectCompass"></div>';
                    $("#objectCompass").append(self.svgDoc);

                    self.setSvg(self.svgDoc);
                    //self.setCtx(self.ctx);

                    self.options.svgDoc = self.svgDoc;

                    //self.attachTo(self.ctx);
                    self.svgDoc.addEventListener('mousedown', function(event) {
                        _handleMouseDown(event, self);
                    });

                    self.svgDoc.addEventListener('mousemove', function(event) {
                        _handleMouseMove(event, self);
                    });

                    self.svgDoc.addEventListener('mouseup', function(event) {
                        _handleMouseUp(event, self);
                    });

                    self.east.addEventListener("click", function () {
                        _updateNorthFromEast(self);
                    });

                    self.west.addEventListener("click", function () {
                        _updateNorthFromWest(self);
                    });

                    self.north.addEventListener("click", function () {
                        _updateNorthFromNorth(self);
                    });

                    self.south.addEventListener("click", function () {
                        _updateNorthFromSouth(self)
                    });

                    self.northText.addEventListener("click", CompassCore._alignWithNorth);

                    if (self.isMobile) {
                        var passiveSupported = Utils.isPassiveSupported();
                        self.svgDoc.addEventListener('touchstart', function(event) {
                            _handleMouseDown(event, self);
                        }, passiveSupported ? {passive: true} : false);
                        self.svgDoc.addEventListener('touchup', function(event) {
                            _handleMouseUp(event, self);
                        });
                        self.svgDoc.addEventListener('touchmove', function(event) {
                            _handleMouseMove(event, self);
                        }, passiveSupported ? {passive: true} : false);
                        self.northText.addEventListener("touchstart", CompassCore._alignWithNorth, passiveSupported ? {passive: true} : false);
                    }


                    // Update fov when moving
                    self.ctx.subscribe(Constants.EVENT_MSG.NAVIGATION_MODIFIED, CompassCore.updateNorth);
                    self.ctx.subscribe(Constants.EVENT_MSG.CRS_MODIFIED, CompassCore.updateNorth);


                    // Publish modified event to update compass north
                    //self.ctx.publish(Constants.EVENT_MSG.NAVIGATION_MODIFIED);
                    $('#' + self.parentElement).css("display", "block");

                },
                "xml");
        };

        /**
         * Detaches the tracker from the context.
         * @function detach
         * @memberOf Compass#
         */
        Compass.prototype.detach = function () {
            var self = this;
            this.svgDoc.removeEventListener('mousedown', function(event) {
                _handleMouseDown(event, self);
            });

            this.svgDoc.removeEventListener('mousemove', function(event) {
                _handleMouseMove(event, self);
            });

            this.svgDoc.removeEventListener('mouseup', function(event) {
                _handleMouseUp(event, self);
            });

            this.east.removeEventListener("click", function () {
                _updateNorthFromEast(self);
            });

            this.west.removeEventListener("click", function () {
                _updateNorthFromWest(self);
            });

            this.north.removeEventListener("click", function () {
                _updateNorthFromNorth(self);
            });

            this.south.removeEventListener("click", function () {
                _updateNorthFromSouth(self)
            });

            this.northText.removeEventListener("click", CompassCore._alignWithNorth);

            if (this.isMobile) {
                var passiveSupported = Utils.isPassiveSupported();
                this.svgDoc.removeEventListener('touchstart', function(event) {
                    _handleMouseDown(event, self);
                });
                this.svgDoc.removeEventListener('touchup', function(event) {
                    _handleMouseUp(event, self);
                });
                this.svgDoc.removeEventListener('touchmove', function(event) {
                    _handleMouseMove(event, self);
                }, passiveSupported ? {passive: true} : false);
                this.northText.removeEventListener("touchstart", CompassCore._alignWithNorth, passiveSupported ? {passive: true} : false);
            }
            // Update fov when moving
            this.ctx.unsubscribe(Constants.EVENT_MSG.NAVIGATION_MODIFIED, CompassCore.updateNorth);
            this.ctx.unsubscribe(Constants.EVENT_MSG.CRS_MODIFIED, CompassCore.updateNorth);
            this.ctx = null;
        };

        /**
         * Destroys the elements.
         * @function destroy
         * @memberOf Compass#
         */
        Compass.prototype.destroy = function () {
            this.detach();
            this.remove();
            this.svgDoc = null;
            this.panFactor = null;
            this.parentElement = null;
            this.ctx = null;
            this.isMobile = null;

            this._lastMouseX = -1;
            this._lastMouseY = -1;
            this._balanceX = -1;
            this._balanceY = -1;
            this._dx = 0;
            this._dy = 0;
            this.dragging = false;

            this.east = null;
            this.west = null;
            this.south = null;
            this.north = null;
            this.northText = null;
            this.outerCircle = null;

        };

        return Compass;

    });
