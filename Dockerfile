FROM node:20

WORKDIR /usr/src/app


COPY . .
RUN npm i && npm run build 
RUN set -x && \
    CPPFLAGS="-DPNG_ARM_NEON_OPT=0" npm ci && \
    npm rebuild sqlite3 --build-from-source
RUN cd src/ui && npm i && npm run build 
RUN npm run build 
RUN ls -l 

CMD ["sh", "-c", "npm run start && cd src/ui && npm run start "]
