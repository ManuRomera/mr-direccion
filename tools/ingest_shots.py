from PIL import Image
S='/private/tmp/shots/';O='/Volumes/Datos_Dock/FoundryVTT/Data/modules/mr-direccion/docs/img/'
m={'glass':'dir-glass','motifs':'dir-motifs','preview':'dir-preview','markers':'dir-markers','editor':'dir-editor','suelo':'dir-suelo','classic':'dir-classic','nobg':'dir-nobg'}
for k,v in m.items(): Image.open(S+v+'.png').convert('RGB').resize((2000,1125),Image.LANCZOS).save(O+k+'.webp','WEBP',quality=84,method=6)
fr=[Image.open(O+k+'.webp').convert('RGB').resize((1000,562),Image.LANCZOS).quantize(160,dither=Image.NONE) for k in ['glass','motifs','preview','markers','editor','suelo','classic','nobg']]
fr[0].save(O+'recorrido.gif',save_all=True,append_images=fr[1:],duration=1900,loop=0,optimize=True)
