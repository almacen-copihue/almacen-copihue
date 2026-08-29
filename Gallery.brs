sub init()
    ' ==== CONFIGURACION ====
    ' Pegá acá tu URL del endpoint y tu secreto (el mismo ROKU_API_SECRET que
    ' cargaste en las variables de entorno del proyecto api-cursos en Vercel).
    m.apiUrl = "https://api-cursos-two.vercel.app/api/roku/imagenes"
    m.apiSecret = VYN2318ES220202AS2318V00B1NC1976SAVN
    m.totalAudiosLocales = 46 ' cantidad de audios de prueba empaquetados en /audio

    m.poster = m.top.findNode("poster")
    m.audio = m.top.findNode("audio")
    m.loadingLabel = m.top.findNode("loadingLabel")
    m.errorLabel = m.top.findNode("errorLabel")
    m.pageLabel = m.top.findNode("pageLabel")

    m.images = []
    m.index = 0

    m.top.focusable = true

    loadImages()
end sub

' Trae la lista de URLs firmadas desde el endpoint de la API.
' (Llamada sincrónica simple para esta primera versión de prueba;
' para producción conviene moverla a un Task node aparte.)
sub loadImages()
    request = CreateObject("roUrlTransfer")
    request.SetUrl(m.apiUrl + "?secret=" + m.apiSecret)
    request.SetCertificatesFile("common:/certs/ca-bundle.crt")
    request.InitClientCertificates()

    response = request.GetToString()

    if response = invalid or response = ""
        showError("No se pudo conectar con el servidor.")
        return
    end if

    json = ParseJSON(response)

    if json = invalid or json.imagenes = invalid or json.imagenes.Count() = 0
        showError("No se encontraron imagenes del curso.")
        return
    end if

    m.images = json.imagenes
    m.loadingLabel.visible = false
    showItem(0)
end sub

sub showError(texto as String)
    m.loadingLabel.visible = false
    m.errorLabel.text = texto
    m.errorLabel.visible = true
end sub

' Muestra la imagen del indice dado y arranca su audio correspondiente
' (cortando el audio anterior primero).
sub showItem(i as Integer)
    if i < 0 or i >= m.images.Count() then return

    m.index = i
    m.poster.uri = m.images[i]

    m.audio.control = "stop"

    audioContent = CreateObject("roSGNode", "ContentNode")
    numeroAudio = (i mod m.totalAudiosLocales) + 1
    numeroTexto = Right("0" + numeroAudio.toStr(), 2)
    audioContent.url = "pkg:/audio/" + numeroTexto + ".mp3"
    m.audio.content = audioContent
    m.audio.control = "play"

    m.pageLabel.text = (i + 1).toStr() + " / " + m.images.Count().toStr()
end sub

function onKeyEvent(key as String, press as Boolean) as Boolean
    if not press then return false

    if key = "right" or key = "OK" or key = "play"
        if m.index < m.images.Count() - 1
            showItem(m.index + 1)
        end if
        return true
    else if key = "left"
        if m.index > 0
            showItem(m.index - 1)
        end if
        return true
    end if

    return false
end function
